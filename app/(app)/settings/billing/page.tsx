"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";
import { goToStripe, loadBilling } from "@/lib/billing";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

const TIERS: Record<string, string> = { starter: "Starter", team: "Team", scale: "Scale" };
const POLLS = 5;

function BillingPage() {
  const org = useOrg();
  const returned = useSearchParams().get("status");
  const { data, error, reload } = useApi(() => loadBilling(org.slug), [org.slug]);
  const [actionError, setActionError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const [polls, setPolls] = useState(0);

  // After Checkout the webhook may land a moment later: look again a few times.
  const waiting = returned === "success" && data?.status === "none" && polls < POLLS;
  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(() => {
      setPolls((n) => n + 1);
      reload();
    }, 2000);
    return () => clearTimeout(t);
  }, [waiting, polls, reload]);

  async function go(call: () => Promise<{ url: string }>) {
    setBusy(true);
    setActionError(null);
    try {
      goToStripe((await call()).url);
    } catch (e) {
      setActionError(e as Error);
      setBusy(false);
    }
  }
  const path = { params: { path: { org: org.slug } } };
  const checkout = () => go(() => unwrap(api.POST("/orgs/{org}/billing/checkout", { ...path, body: {} })));
  const portal = () => go(() => unwrap(api.POST("/orgs/{org}/billing/portal", path)));

  const owner = org.role === "owner";
  const status = data?.status;
  const subscribed = status === "trialing" || status === "active" || status === "past_due" || status === "paused";
  const days = data?.trial_ends_at ? Math.max(0, Math.ceil((Date.parse(data.trial_ends_at) - Date.now()) / 864e5)) : 0;
  const tier = data?.tier ? TIERS[data.tier] : undefined;
  const n = data?.quantity ?? 0;

  return (
    <main>
      <h1>Billing</h1>
      <ErrorNote error={error ?? actionError} />
      {data === null && <p className="muted">Billing isn&apos;t set up yet.</p>}
      {returned === "canceled" && <p className="muted">Checkout was cancelled. Nothing was charged.</p>}
      {waiting && <p className="muted">Confirming your plan…</p>}
      {data && (
        <section className="stack">
          {status === "trialing" && <p>Trial: {days} days left</p>}
          {tier && n > 0 && (
            <p>
              {n} cloud {n === 1 ? "account" : "accounts"} billed on {tier}
            </p>
          )}
          {data.limits && (
            <p className="muted">{data.limits.ai_credits.toLocaleString("en-US")} AI credits per cloud account each period</p>
          )}
          {data.current_period_end && subscribed && status !== "trialing" && (
            <p className="muted">Renews {new Date(data.current_period_end).toLocaleDateString()}</p>
          )}
          {!owner && <p className="muted">Only an owner can change the plan.</p>}
          {owner && subscribed && (
            <button type="button" className="fit" disabled={busy} onClick={portal}>Manage billing</button>
          )}
          {owner && !subscribed && (
            <button type="button" className="primary fit" disabled={busy} onClick={checkout}>
              {status === "none" ? "Start free trial" : "Start plan"}
            </button>
          )}
        </section>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <BillingPage />
    </Suspense>
  );
}
