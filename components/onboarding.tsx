"use client";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { CreateOrg } from "@/components/create-org";
import { DeleteAccount } from "@/components/delete-account";
import { ErrorNote } from "@/components/error-note";
import { SignOut } from "@/components/sign-out";
import { api, unwrap } from "@/lib/api/client";
import type { OnboardingStep } from "@/lib/onboarding";
import { log } from "@/lib/log";
import { addPasskey, dismissPasskeyPrompt } from "@/lib/webauthn";

const LABEL: Record<OnboardingStep, string> = { terms: "Terms", org: "Organisation" };

/** The recommended passkey (ticked by default, never required) and the terms on one card. */
function TermsStep({ offerPasskey, onAccepted }: { offerPasskey: boolean; onAccepted: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [withPasskey, setWithPasskey] = useState(offerPasskey);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function accept() {
    if (!agreed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await unwrap(api.POST("/auth/me/terms"));
    } catch (err) {
      setError(err as Error);
      setBusy(false);
      return;
    }
    if (withPasskey) {
      // The terms are agreed either way: a cancelled or failed passkey never holds the person back.
      await addPasskey().catch((err) => log.warn("adding a passkey failed", { name: err instanceof Error ? err.name : undefined }));
    } else if (offerPasskey) {
      dismissPasskeyPrompt();
    }
    onAccepted();
  }

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); void accept(); }}>
      <h1>Before you start</h1>
      <p>OpsAgent reads your cloud accounts with read-only access. Please read and agree to how we work and how we handle your data.</p>
      {offerPasskey && (
        <label className="row agree onboarding-passkey">
          <input type="checkbox" checked={withPasskey} onChange={(e) => setWithPasskey(e.target.checked)} />
          <span>
            <strong>Add a passkey <span className="muted">(recommended)</span></strong>
            <span className="muted small">Sign in next time with your fingerprint, face or device PIN. No email to wait for, and nothing to phish. Untick to skip: you can add one later in Settings, under Security.</span>
          </span>
        </label>
      )}
      <label className="row agree">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>
          I agree to the <Link href="/terms" target="_blank" rel="noopener">Terms</Link> and the{" "}
          <Link href="/privacy" target="_blank" rel="noopener">Privacy Policy</Link>
        </span>
      </label>
      <div className="row">
        <button type="submit" disabled={!agreed || busy}>Continue</button>
      </div>
      <ErrorNote error={error} />
    </form>
  );
}

/** The full-screen flow a signed-in person sees while a step is open: no sidebar, one step at a time. */
export function Onboarding({ email, step, steps, offerPasskey, onTermsAccepted, onChanged }: {
  email: string;
  step: OnboardingStep;
  steps: OnboardingStep[];
  /** No passkey yet and the browser can make one: the terms step offers it. */
  offerPasskey: boolean;
  onTermsAccepted: () => void;
  /** Reloads the session after an organisation was added. */
  onChanged: () => void;
}) {
  const at = steps.indexOf(step);
  return (
    <div className="app onboarding">
      <header className="onboarding-bar">
        <Logo size={22} />
        <span className="account-email">{email}</span>
        <DeleteAccount email={email} />
        <SignOut className="link" />
      </header>
      <main>
        <p className="eyebrow">Welcome to OpsAgent · Step {at + 1} of {steps.length}</p>
        <ol className="steps-strip" aria-label="Steps">
          {steps.map((s, i) => (
            <li key={s} data-done={i < at || undefined} aria-current={s === step ? "step" : undefined}>
              <span className="n" aria-hidden="true">{i < at ? "✓" : i + 1}</span>
              {LABEL[s]}
            </li>
          ))}
        </ol>
        <section className="card onboarding-card">
          {step === "terms" && <TermsStep offerPasskey={offerPasskey} onAccepted={onTermsAccepted} />}
          {step === "org" && <CreateOrg onCreated={onChanged} intro={<p>Your organisation owns your cloud connections, findings and billing.</p>} />}
        </section>
      </main>
    </div>
  );
}
