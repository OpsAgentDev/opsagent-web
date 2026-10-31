"use client";
import { useState } from "react";
import { AiKeyCard } from "@/components/ai-key-card";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type AiStatus } from "@/lib/api/client";

type Props = { org: string; s: AiStatus; onChanged: () => void };

/** The org-wide monthly credit ceiling across both own keys. */
function Ceiling({ org, s, onChanged }: Props) {
  const [ceiling, setCeiling] = useState(s.monthly_credit_ceiling ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      const body = { monthly_credit_ceiling: ceiling === "" ? null : Number(ceiling) };
      await unwrap(api.PATCH("/orgs/{org}/ai", { params: { path: { org } }, body }));
      setError(null);
      setSaved(true);
      onChanged();
    } catch (e) {
      setError(e as Error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <label>
        Monthly credit ceiling (optional)
        <input type="number" min={0} step="0.01" value={ceiling} onChange={(e) => setCeiling(e.target.value)} />
      </label>
      <ErrorNote error={error} />
      {saved && <p role="status">Saved.</p>}
      <button type="button" className="fit" disabled={busy} onClick={save}>Save ceiling</button>
    </div>
  );
}

/** Bring your own key: owners only (brain enforces it too). A primary, then an optional backup. */
export function ByokForm({ org, s, onChanged }: Props) {
  const { primary, backup } = s.keys;
  const primaryRemove = backup
    ? "Remove this key? The backup becomes your primary key."
    : s.enabled
      ? "Remove this key? Dashboard AI will then use Anthropic on OpsAgent's key."
      : "Remove this key?";

  return (
    <section className="stack">
      <h2>Your own key</h2>
      <AiKeyCard org={org} slot="primary" title="Primary key" aiKey={primary} removeText={primaryRemove} onChanged={onChanged} />
      {primary && (
        <AiKeyCard
          org={org}
          slot="backup"
          title="Backup key (optional)"
          aiKey={backup}
          removeText="Remove this key?"
          onChanged={onChanged}
        />
      )}
      <Ceiling org={org} s={s} onChanged={onChanged} />
    </section>
  );
}
