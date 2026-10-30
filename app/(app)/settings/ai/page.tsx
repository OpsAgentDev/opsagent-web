"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AiStateNote } from "@/components/ai-state-note";
import { ByokForm } from "@/components/byok-form";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type AiStatus } from "@/lib/api/client";
import { formatCredits, TURN_ON_NOTICE } from "@/lib/ai";
import { goToStripe } from "@/lib/billing";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

const PROVIDERS: Record<string, string> = { anthropic: "Anthropic", openai: "OpenAI" };

function providerLine(s: AiStatus): string {
  if (s.source === "byok" && s.key) return `Provider: ${PROVIDERS[s.key.provider] ?? s.key.provider}, on your own key`;
  if (s.source === "opsagent") return "Provider: Anthropic, on OpsAgent's key";
  return "Provider: none yet";
}

function Usage({ s }: { s: AiStatus }) {
  const u = s.usage;
  return (
    <section className="stack">
      <h2>Usage</h2>
      <label>
        Used {formatCredits(u.used)} of {formatCredits(u.quota)} credits
        <meter min={0} max={Number(u.quota) || 1} value={Number(u.used)} />
      </label>
      <p>Top-up balance: {formatCredits(u.topup_balance)} credits</p>
      {s.key && (
        <p>
          Your own key this month: {formatCredits(u.byok_used_this_month)} credits{u.estimated ? " (estimated)" : ""}
        </p>
      )}
      <p className="muted">Resets on {new Date(u.period_end).toLocaleDateString()}</p>
    </section>
  );
}

function AiSettings() {
  const org = useOrg();
  const topup = useSearchParams().get("topup");
  const path = { params: { path: { org: org.slug } } };
  const { data: s, error, reload } = useApi(() => unwrap(api.GET("/orgs/{org}/ai", path)), [org.slug]);
  const [actionError, setActionError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const owner = org.role === "owner";

  async function act(call: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await call();
    } catch (e) {
      setActionError(e as Error);
    } finally {
      setBusy(false);
    }
  }
  const toggle = (enabled: boolean) =>
    act(async () => {
      await unwrap(api.PATCH("/orgs/{org}/ai", { ...path, body: { enabled } }));
      reload();
    });
  const buy = () => act(async () => goToStripe((await unwrap(api.POST("/orgs/{org}/ai/topup", path))).url));

  return (
    <main>
      <h1>Dashboard AI</h1>
      <ErrorNote error={error ?? actionError} />
      {topup === "success" && <p role="status">Thanks. Your credits appear here once the payment is confirmed.</p>}
      {topup === "canceled" && <p className="muted">Top-up cancelled. Nothing was charged.</p>}
      {!s && !error && <p className="muted" role="status">Loading…</p>}
      {s && (
        <>
          {owner ? (
            <section className="stack">
              <p>{TURN_ON_NOTICE}</p>
              <label className="row">
                <input type="checkbox" checked={s.enabled} disabled={busy} onChange={(e) => toggle(e.target.checked)} />
                Dashboard AI on
              </label>
              {s.state !== "ai_disabled" && <AiStateNote code={s.state} role={org.role} />}
            </section>
          ) : (
            <AiStateNote code={s.state} role={org.role} />
          )}
          {(owner || s.enabled) && (
            <>
              <p>{providerLine(s)}</p>
              <Usage s={s} />
            </>
          )}
          {owner && s.topup_available && (
            <button type="button" className="fit" disabled={busy} onClick={buy}>Buy 1,000 credits for $15</button>
          )}
          {owner && <ByokForm org={org.slug} aiKey={s.key} onChanged={reload} />}
        </>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <AiSettings />
    </Suspense>
  );
}
