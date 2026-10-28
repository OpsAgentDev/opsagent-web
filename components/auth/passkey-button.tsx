"use client";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { authMessage } from "@/lib/auth-errors";
import { log } from "@/lib/log";
import { isSameOrigin } from "@/lib/safe-redirect";
import { cancelled, signInWithPasskey, supported } from "@/lib/webauthn";

/** "Sign in with a passkey": a discoverable request ceremony, so no email is typed. Hidden without WebAuthn. */
export function PasskeyButton({ returnTo }: { returnTo?: string }) {
  // Decided after hydration: the server can't know whether the browser has WebAuthn.
  const [shown, setShown] = useState(false);
  useEffect(() => setShown(supported()), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!shown) return null;

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const redirect = await signInWithPasskey(returnTo);
      if (!isSameOrigin(redirect, window.location.origin)) throw new Error("Unexpected sign-in redirect.");
      window.location.assign(redirect);
    } catch (err) {
      log.warn("passkey sign-in failed", { name: err instanceof Error ? err.name : undefined, code: err instanceof ApiError ? err.code : undefined });
      setError(cancelled(err) ? "Passkey sign-in was cancelled." : authMessage(err));
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="auth-btn primary" disabled={busy} onClick={signIn}>Sign in with a passkey</button>
      {error ? <p role="alert" className="error">{error}</p> : null}
      <p className="auth-or">or</p>
    </>
  );
}
