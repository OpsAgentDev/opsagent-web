"use client";
import { OrgLink } from "@/components/org-link";
import { useEffect } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";
import { loadBilling } from "@/lib/billing";
import { isOwner, liveRecipients } from "@/lib/delivery";
import { log } from "@/lib/log";
import { useSetup } from "@/lib/org";
import { hasFinishedScan } from "@/lib/scan";
import { requiredOpen, setupSteps, type SetupInputs, type StepId } from "@/lib/setup-steps";
import { useApi } from "@/lib/use-api";
import { usePasskeyAdd } from "@/lib/use-passkey-add";
import { supported } from "@/lib/webauthn";

type Reads = Omit<SetupInputs, "hasPasskey">;

/** One read; a failure is logged and becomes `undefined`, so its step stays open and nothing else is blocked. */
const soft = <T,>(name: string, p: Promise<T>) =>
  p.catch((err: unknown) => {
    log.warn("setup checklist read failed", { read: name, status: (err as { status?: number }).status });
    return undefined;
  });

async function loadReads(org: string): Promise<Reads> {
  const path = { params: { path: { org } } };
  const [conns, billing, integrations, recipients] = await Promise.all([
    soft("connections", unwrap(api.GET("/orgs/{org}/connections", path))),
    soft("billing", loadBilling(org)),
    soft("integrations", unwrap(api.GET("/orgs/{org}/integrations", path))),
    soft("recipients", unwrap(api.GET("/orgs/{org}/recipients", path))),
  ]);
  const ran = conns?.length ? await soft("scan", hasFinishedScan(org)) : undefined;
  // Only disconnected accounts left: no scan is coming, so the step does not wait for one.
  const idle = conns?.every((c) => c.status === "disconnected");
  const delivered = !!integrations?.some((i) => i.status === "active") || !!(recipients && liveRecipients(recipients.items).length);
  return {
    billing: billing ?? null,
    connections: conns ? conns.length : null,
    scanned: idle || (ran ?? null),
    delivery: delivered ? true : integrations && recipients ? false : null,
  };
}

const COPY: Record<StepId, { title: string; why: string }> = {
  org: { title: "Create your organisation", why: "It owns your cloud connections, findings and billing." },
  trial: { title: "Start your free trial", why: "Connecting a cloud account needs a plan; the trial is free." },
  aws: { title: "Connect a cloud account (optional)", why: "Read-only access, so OpsAgent can scan it. AWS is available now, more clouds are coming. You can do this later." },
  scan: { title: "Run your first scan", why: "OpsAgent starts on its own once an account is connected." },
  delivery: { title: "Choose where briefings go", why: "Slack or email, so findings reach you without opening the app." },
  passkey: { title: "Add a passkey (optional)", why: "Sign in with your fingerprint, face or device PIN." },
};

function Mark({ state }: { state: string }) {
  return (
    <svg className="mark" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {state === "done" && <path d="M6 10.4l2.6 2.6L14 7.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
      {state === "current" && <circle cx="10" cy="10" r="3.5" fill="currentColor" />}
    </svg>
  );
}

const PLAN_COPY = { title: "Start a plan", why: "Connecting a cloud account needs a plan." };

/** The dashboard's setup checklist; renders nothing until every read settles and again once required steps are done. */
export function SetupChecklist({ org, role, hasPasskey, onPasskeyAdded, skipped, onSkip }: {
  org: string;
  skipped: boolean;
  onSkip: () => void;
  role: string;
  hasPasskey: boolean;
  onPasskeyAdded: () => void;
}) {
  const { setChecklistOpen } = useSetup();
  const { data } = useApi(() => loadReads(org), [org]);
  const { busy, error, add } = usePasskeyAdd(onPasskeyAdded);
  const steps = data && setupSteps({ ...data, hasPasskey: hasPasskey || !supported() });
  const open = steps ? requiredOpen(steps) && !skipped : null;
  // Tells the layout to hold back its own passkey card while this shows (null: not known yet).
  useEffect(() => {
    setChecklistOpen(open);
    return () => setChecklistOpen(null);
  }, [open, setChecklistOpen]);
  if (!steps || !open) return null;

  const owner = isOwner(role);
  const noTrialLeft = data?.billing?.trial_available === false;
  const copy = (id: StepId) => (id === "trial" && noTrialLeft ? PLAN_COPY : COPY[id]);
  function action(id: StepId) {
    const ask = (what: string) => <span className="muted">Ask an owner to {what}.</span>;
    switch (id) {
      case "trial": return owner ? <OrgLink href="/settings/billing">{noTrialLeft ? "Start plan" : "Start free trial"}</OrgLink> : ask(noTrialLeft ? "start a plan" : "start the trial");
      case "aws": return owner ? <OrgLink href="/onboarding/connect-aws">Connect an AWS account</OrgLink> : ask("connect a cloud account");
      case "scan": return <span className="muted">Scanning, this takes a few minutes</span>;
      case "delivery": return owner ? <OrgLink href="/settings/delivery">Set up delivery</OrgLink> : ask("choose where briefings go");
      case "passkey": return <button type="button" disabled={busy} onClick={add}>Add a passkey</button>;
      default: return null;
    }
  }

  return (
    <section className="card checklist-card" aria-labelledby="checklist-title">
      <h2 id="checklist-title">Get set up</h2>
      <ol className="checklist" aria-label="Setup">
        {steps.map((s) => (
          <li key={s.id} data-state={s.state} aria-current={s.state === "current" ? "step" : undefined}>
            <Mark state={s.state} />
            <div>
              <strong>{copy(s.id).title}</strong>
              <span className="sr-only">{s.state === "done" ? " (done)" : ""}</span>
              <p>{copy(s.id).why}</p>
            </div>
            {/* The passkey nudge stays actionable while required steps are open: the layout's card is hidden meanwhile. */}
            {(s.state === "current" || s.id === "passkey") && <div className="act">{action(s.id)}</div>}
          </li>
        ))}
      </ol>
      <p className="skip"><button type="button" className="link" onClick={onSkip}>Skip for now</button></p>
      <ErrorNote error={error} />
    </section>
  );
}
