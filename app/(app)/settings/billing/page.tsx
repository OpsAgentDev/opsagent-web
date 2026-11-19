"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { TrialPanel } from "@/components/trial-panel";
import { api, unwrap } from "@/lib/api/client";
import { accountsLine, checkoutOffers, daysLeft, daysLeftText, goToStripe, hadSubscription, loadBilling, PAID_AT_ONCE, TIERS } from "@/lib/billing";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

const POLLS = 5;

function BillingPage() {
  const org = useOrg();
  const returned = useSearchParams().get("status");
  const { data, error, reload } = useApi(() => loadBilling(org.slug), [org.slug]);
  // Billing counts at least one account while subscribed, so "none connected yet" is read from the connections.
  const { data: connections, loading: counting } = useApi(
    () => unwrap(api.GET("/orgs/{org}/connections", { params: { path: { org: org.slug } } })),
    [org.slug],
  );
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
  const checkout = (tier: string) => go(() => unwrap(api.POST("/orgs/{org}/billing/checkout", { ...path, body: { tier } })));
  const portal = () => go(() => unwrap(api.POST("/orgs/{org}/billing/portal", path)));

  const owner = org.role === "owner";
  const status = data?.status;
  const subscribed = status === "trialing" || status === "active" || status === "past_due" || status === "paused";
  const noPlan = status === "none" || status === "trial_ended" || status === "canceled";
  const days = daysLeft(data?.trial_ends_at) ?? 0;
  const tier = data?.tier ? TIERS[data.tier] : undefined;
  const cancelled = !!data?.cancel_at_period_end;
  const lastDay = status === "trialing" ? data?.trial_ends_at : data?.current_period_end;
  const n = data?.quantity ?? 0;

  return (
    <main>
      <h1>Billing</h1>
      <ErrorNote error={error ?? actionError} />
      {data === null && <p className="muted">Billing isn&apos;t set up yet.</p>}
      {returned === "canceled" && <p className="muted">Checkout was cancelled. Nothing was charged.</p>}
      {waiting && <p className="muted" role="status">Confirming your plan…</p>}
      {data && (
        <section className="stack">
          {status === "trialing" && !cancelled && <p>Trial: {daysLeftText(days)}</p>}
          {cancelled && lastDay && (
            <p>
              Cancelled. Your {status === "trialing" ? "trial" : "plan"} ends {new Date(lastDay).toLocaleDateString()} and you
              won&apos;t be charged again.
            </p>
          )}
          {tier && n > 0 && !counting && <p>{accountsLine(tier, n, connections?.filter((c) => c.first_connected_at).length)}</p>}
          {data.limits && (
            <p className="muted">{/* The trial gets 1,000 whatever the tier. */}
              {(status === "trialing" ? 1000 : data.limits.ai_credits).toLocaleString("en-US")} AI credits per cloud account each period</p>
          )}
          {data.current_period_end && subscribed && status !== "trialing" && !cancelled && (
            <p className="muted">Renews {new Date(data.current_period_end).toLocaleDateString()}</p>
          )}
          {!owner && <p className="muted">{noPlan ? "Only an owner can start a plan." : "Only an owner can change the plan."}</p>}
          {owner && noPlan && <TrialPanel available={status === "none" && data.trial_available !== false} />}
          {owner && !subscribed && (
            <>
              <div className="row">
                {checkoutOffers(data).map((o, i) => (
                  <button key={o.tier} type="button" className={i ? undefined : "primary"} disabled={busy} onClick={() => checkout(o.tier)}>
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="muted">{PAID_AT_ONCE}</p>
            </>
          )}
          {owner && hadSubscription(data) && (
            <button type="button" className="fit" disabled={busy} onClick={portal}>Manage billing</button>
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
