"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type Billing } from "@/lib/api/client";
import { upgradePlans } from "@/lib/billing";
import { PLAN_FEATURES, type Plan } from "@/lib/plans";

type DialogProps = { org: string; plans: Plan[]; trialing: boolean; onDone: () => void; onClose: () => void };

/** The higher tiers, the nearest one featured and chosen; one confirm moves the subscription up. */
function UpgradeDialog({ org, plans, trialing, onDone, onClose }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [tier, setTier] = useState(plans[0]!.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => ref.current?.showModal(), []);
  const chosen = plans.find((p) => p.id === tier)!;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await unwrap(api.POST("/orgs/{org}/billing/plan", { params: { path: { org } }, body: { tier } }));
      onDone();
      ref.current?.close();
    } catch (err) {
      setError(err as Error);
      setBusy(false);
    }
  }

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="upgrade-title" className="upgrade">
      <form className="stack" onSubmit={submit}>
        <h2 id="upgrade-title">Upgrade your plan</h2>
        <fieldset className="upgrade-plans">
          <legend className="sr-only">Plan</legend>
          {plans.map((p, i) => (
            <label key={p.id} className={i === 0 ? "upgrade-plan featured" : "upgrade-plan"}>
              <input type="radio" name="tier" value={p.id} checked={tier === p.id} onChange={() => setTier(p.id)} />
              <span className="upgrade-name">{p.name}</span>
              <span className="upgrade-price">{p.price} <span>per cloud account per month</span></span>
              <span className="upgrade-limits">{PLAN_FEATURES.map(([label, key]) => `${label}: ${p[key]}`).join(" · ")}</span>
            </label>
          ))}
        </fieldset>
        <p className="muted">{trialing ? "Your free trial carries on with the new plan." : "You pay the difference for the rest of this billing period."}</p>
        <div className="row">
          <button type="submit" disabled={busy}>Upgrade to {chosen.name}</button>
          <button type="button" className="quiet" onClick={() => ref.current?.close()}>Cancel</button>
        </div>
        <ErrorNote error={error} />
      </form>
    </dialog>
  );
}

/** The top bar's Upgrade button, for owners: nothing when there is no higher tier or the plan isn't running. */
export function Upgrade({ org, billing, onUpgraded }: { org: string; billing: Billing | null | undefined; onUpgraded: () => void }) {
  const [open, setOpen] = useState(false);
  const plans = upgradePlans(billing);
  if (!plans.length) return null;
  return (
    <>
      <button type="button" className="upgrade-button" onClick={() => setOpen(true)}>Upgrade</button>
      {open && <UpgradeDialog org={org} plans={plans} trialing={billing?.status === "trialing"} onDone={onUpgraded} onClose={() => setOpen(false)} />}
    </>
  );
}
