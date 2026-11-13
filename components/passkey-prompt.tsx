"use client";
import { useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { usePasskeyAdd } from "@/lib/use-passkey-add";
import { dismissPasskeyPrompt, isDismissed, readDismissedAt, supported } from "@/lib/webauthn";

/** The recommendation card, shown by the (app) layout while the user has no passkey. "Not now" hides it for 30 days. */
export function PasskeyPrompt({ onAdded }: { onAdded: () => void }) {
  // Client-only: the layout renders this after its client-side session load, so localStorage is there.
  const [hidden, setHidden] = useState(
    () => !supported() || isDismissed(readDismissedAt(localStorage), Date.now()),
  );
  const { busy, error, add } = usePasskeyAdd(onAdded);
  if (hidden) return null;

  function notNow() {
    dismissPasskeyPrompt();
    setHidden(true);
  }

  return (
    <section className="card passkey-prompt" aria-labelledby="passkey-prompt-title">
      <h2 id="passkey-prompt-title">Add a passkey (recommended)</h2>
      <p>Sign in next time with your fingerprint, face or device PIN. No email to wait for.</p>
      <div className="row">
        <button type="button" className="primary" disabled={busy} onClick={add}>Add a passkey</button>
        <button type="button" disabled={busy} onClick={notNow}>Not now</button>
      </div>
      <ErrorNote error={error} />
    </section>
  );
}
