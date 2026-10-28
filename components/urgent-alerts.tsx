"use client";
import { useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type Connection } from "@/lib/api/client";

type Props = { owner: boolean; org: string; connections: Connection[]; onChanged: () => void };

/** Per-connection switch for urgent alerts (on by default). Owners only; brain enforces it too. */
export function UrgentAlerts({ owner, org, connections, onChanged }: Props) {
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(id: string, urgent_alerts: boolean) {
    setBusy(id);
    try {
      await unwrap(
        api.PATCH("/orgs/{org}/connections/{id}", {
          params: { path: { org, id } },
          body: { urgent_alerts },
        }),
      );
      setError(null);
      onChanged();
    } catch (err) {
      setError(err as Error);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <h2>Urgent alerts</h2>
      <ErrorNote error={error} />
      {connections.map((c) => (
        <label key={c.id} className="row">
          <input
            type="checkbox"
            checked={c.urgent_alerts}
            disabled={!owner || busy === c.id}
            onChange={(e) => toggle(c.id, e.target.checked)}
          />
          <span>
            Urgent alerts: tell me right away about new critical problems (Slack, or email if Slack isn&apos;t
            connected)
          </span>
          <span className="muted">{c.display_name ?? c.id}</span>
        </label>
      ))}
    </section>
  );
}
