"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";
import { loadBilling } from "@/lib/billing";
import { isOwner, liveRecipients } from "@/lib/delivery";
import { log } from "@/lib/log";
import { useSetup } from "@/lib/org";
import { latestScanStats } from "@/lib/scan";
import { requiredOpen, setupSteps, type SetupInputs, type StepId } from "@/lib/setup-steps";
import { useApi } from "@/lib/use-api";
import { addPasskey, cancelled, supported } from "@/lib/webauthn";

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
  const first = conns?.[0];
  const stats = first ? await soft("scan", latestScanStats(org, first.id)) : undefined;
  const delivered = !!integrations?.some((i) => i.status === "active") || !!(recipients && liveRecipients(recipients.items).length);
  return {
    billing: billing ?? null,
    connections: conns ? conns.length : null,
    scanned: stats === undefined ? null : stats !== null,
    delivery: delivered ? true : integrations && recipients ? false : null,
  };
}

const COPY: Record<StepId, { title: string; why: string }> = {
  org: { title: "Create your organisation", why: "It owns your cloud connections, findings and billing." },
  trial: { title: "Start your free trial", why: "Connecting a cloud account needs a plan; the trial is free." },
  aws: { title: "Connect AWS", why: "Read-only access, so OpsAgent can scan your account." },
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

/** The dashboard's setup checklist; renders nothing until every read settles and again once required steps are done. */
export function SetupChecklist({ org, role, hasPasskey, onPasskeyAdded }: {
  org: string;
  role: string;
  hasPasskey: boolean;
  onPasskeyAdded: () => void;
}) {
  const { setChecklistOpen } = useSetup();
  const { data } = useApi(() => loadReads(org), [org]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const steps = data && setupSteps({ ...data, hasPasskey: hasPasskey || !supported() });
  const open = steps ? requiredOpen(steps) : null;
  // Tells the layout to hold back its own passkey card while this shows (null: not known yet).
  useEffect(() => {
    setChecklistOpen(open);
    return () => setChecklistOpen(null);
  }, [open, setChecklistOpen]);
  if (!steps || !open) return null;

  const owner = isOwner(role);
  async function add() {
    setBusy(true);
    setError(null);
    try {
      await addPasskey();
      onPasskeyAdded();
    } catch (err) {
      log.warn("adding a passkey failed", { name: err instanceof Error ? err.name : undefined });
      if (!cancelled(err)) setError(err as Error);
      setBusy(false);
    }
  }

  function action(id: StepId) {
    const ask = (what: string) => <span className="muted">Ask an owner to {what}.</span>;
    switch (id) {
      case "trial": return owner ? <Link href="/settings/billing">Start free trial</Link> : ask("start the trial");
      case "aws": return <Link href="/onboarding/connect-aws">Connect an AWS account</Link>;
      case "scan": return <span className="muted">Scanning, this takes a few minutes</span>;
      case "delivery": return owner ? <Link href="/settings/delivery">Set up delivery</Link> : ask("choose where briefings go");
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
              <strong>{COPY[s.id].title}</strong>
              <span className="sr-only">{s.state === "done" ? " (done)" : ""}</span>
              <p>{COPY[s.id].why}</p>
            </div>
            {/* The passkey nudge stays actionable while required steps are open: the layout's card is hidden meanwhile. */}
            {(s.state === "current" || s.id === "passkey") && <div className="act">{action(s.id)}</div>}
          </li>
        ))}
      </ol>
      <ErrorNote error={error} />
    </section>
  );
}
