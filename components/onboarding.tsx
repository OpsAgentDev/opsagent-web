"use client";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { CreateOrg } from "@/components/create-org";
import { DeleteAccount } from "@/components/delete-account";
import { ErrorNote } from "@/components/error-note";
import { ThemeSwitch } from "@/components/theme-switch";
import { SignOut } from "@/components/sign-out";
import { api, unwrap } from "@/lib/api/client";
import type { OnboardingStep } from "@/lib/onboarding";
import { usePasskeyAdd } from "@/lib/use-passkey-add";
import { dismissPasskeyPrompt } from "@/lib/webauthn";

const LABEL: Record<OnboardingStep, string> = { terms: "Terms", passkey: "Passkey", org: "Organisation" };

function TermsStep({ onAccepted }: { onAccepted: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      await unwrap(api.POST("/auth/me/terms"));
      onAccepted();
    } catch (err) {
      setError(err as Error);
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); if (agreed && !busy) void accept(); }}>
      <h1>Agree to the terms</h1>
      <p>OpsAgent reads your cloud accounts with read-only access. Before you start, please read and agree to how we work and how we handle your data.</p>
      <label className="row agree">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>
          I agree to the <Link href="/terms" target="_blank" rel="noopener">Terms</Link> and the{" "}
          <Link href="/privacy" target="_blank" rel="noopener">Privacy Policy</Link>
        </span>
      </label>
      <button type="submit" disabled={!agreed || busy}>Continue</button>
      <ErrorNote error={error} />
    </form>
  );
}

function PasskeyStep({ onAdded, onSkip }: { onAdded: () => void; onSkip: () => void }) {
  const { busy, error, add } = usePasskeyAdd(onAdded);
  return (
    <div className="stack">
      <h1>Add a passkey</h1>
      <p>Sign in next time with your fingerprint, face or device PIN. No email to wait for, and nothing to phish.</p>
      <div className="row">
        <button type="button" className="primary" disabled={busy} onClick={add}>Add a passkey</button>
        <button type="button" disabled={busy} onClick={() => { dismissPasskeyPrompt(); onSkip(); }}>Skip for now</button>
      </div>
      <p className="muted small">You can add one later in Settings, under Security.</p>
      <ErrorNote error={error} />
    </div>
  );
}

/** The full-screen flow a signed-in person sees while a step is open: no sidebar, one step at a time. */
export function Onboarding({ email, step, steps, onTermsAccepted, onPasskeySkipped, onChanged }: {
  email: string;
  step: OnboardingStep;
  steps: OnboardingStep[];
  onTermsAccepted: () => void;
  onPasskeySkipped: () => void;
  /** Reloads the session after a passkey or an organisation was added. */
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
          {step === "terms" && <TermsStep onAccepted={onTermsAccepted} />}
          {step === "passkey" && <PasskeyStep onAdded={onChanged} onSkip={onPasskeySkipped} />}
          {step === "org" && <CreateOrg onCreated={onChanged} intro={<p>Your organisation owns your cloud connections, findings and billing.</p>} />}
        </section>
        <div className="onboarding-theme"><ThemeSwitch /></div>
      </main>
    </div>
  );
}
