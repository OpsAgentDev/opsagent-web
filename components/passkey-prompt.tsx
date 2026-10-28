"use client";
import { useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { log } from "@/lib/log";
import { addPasskey, cancelled, DISMISSED_KEY, isDismissed, supported } from "@/lib/webauthn";

/** The recommendation card, shown by the (app) layout while the user has no passkey. "Not now" hides it for 30 days. */
export function PasskeyPrompt({ onAdded }: { onAdded: () => void }) {
  // Client-only: the layout renders this after its client-side session load, so localStorage is there.
  const [hidden, setHidden] = useState(
    () => !supported() || isDismissed(Number(localStorage.getItem(DISMISSED_KEY)) || null, Date.now()),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  if (hidden) return null;

  async function add() {
    setBusy(true);
    setError(null);
    try {
      await addPasskey();
      onAdded();
    } catch (err) {
      log.warn("adding a passkey failed", { name: err instanceof Error ? err.name : undefined });
      if (!cancelled(err)) setError(err as Error);
      setBusy(false);
    }
  }

  function notNow() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
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
