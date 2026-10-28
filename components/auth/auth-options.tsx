"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { CodeInput } from "@/components/auth/code-input";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { authMessage, isProviderUrl, messageFor } from "@/lib/auth-errors";
import { log } from "@/lib/log";
import { isSameOrigin } from "@/lib/safe-redirect";

type Props = {
  mode: "sign-up" | "sign-in";
  /** Brain keeps only /oauth/consent?request_id=<uuid>; anything else is dropped there. */
  returnTo?: string;
  /** A provider callback's `?error=` code. */
  error?: string;
  /** Sign-in only: the passkey button and its own "or" divider, shown first (it renders nothing without WebAuthn). */
  passkeySlot?: ReactNode;
};

export function AuthOptions({ mode, returnTo, error: initialError, passkeySlot }: Props) {
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState(initialError ? messageFor(initialError) : null);
  const [notice, setNotice] = useState<string | null>(null);
  // Disabled until hydrated: a click before then would be lost, and a native submit would put the email in the URL.
  const [busy, setBusy] = useState(true);
  useEffect(() => setBusy(false), []);
  // Already signed in: brain would answer the buttons below with a csrf 403, so leave instead.
  useEffect(() => {
    api.GET("/auth/me").then(({ response }) => {
      if (!response.ok) return;
      window.location.replace(returnTo && isSameOrigin(returnTo, window.location.origin) ? returnTo : "/dashboard");
    }, () => {});
  }, [returnTo]);
  // Remounts the code input (clearing it) after a wrong code.
  const [attempt, setAttempt] = useState(0);
  const query = { return_to: returnTo };
  const keep = returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : "";

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      log.warn("sign-in step failed", { code: err instanceof ApiError ? err.code : undefined });
      setError(authMessage(err));
      setAttempt((n) => n + 1);
      setBusy(false);
    }
  }

  const provider = (name: "google" | "github") =>
    run(async () => {
      const { url } = await unwrap(
        name === "google"
          ? api.POST("/auth/sign-in/google/start", { params: { query } })
          : api.POST("/auth/sign-in/github/start", { params: { query } }),
      );
      if (!isProviderUrl(url)) throw new Error("Unexpected provider URL.");
      window.location.assign(url);
    });

  const request = (address: string, sent?: string) =>
    run(async () => {
      await unwrap(api.POST("/auth/magic-link", { body: { email: address, return_to: returnTo } }));
      setEmail(address);
      setNotice(sent ?? null);
      setAttempt((n) => n + 1); // a fresh, empty code input
      setBusy(false);
    });

  function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void request(String(new FormData(e.currentTarget).get("email")));
  }

  const verify = (code: string) =>
    run(async () => {
      const { redirect } = await unwrap(api.POST("/auth/magic-link/verify", { body: { email: email ?? "", code } }));
      if (!isSameOrigin(redirect, window.location.origin)) throw new Error("Unexpected sign-in redirect.");
      window.location.assign(redirect);
    });

  const signIn = mode === "sign-in";
  const alert = error ? <p role="alert" className="error">{error}</p> : null;

  if (email) {
    return (
      <div className="auth-options">
        <h1>Check your email</h1>
        <p>We sent a sign-in code to {email}. It works once and expires in 15 minutes.</p>
        <CodeInput key={attempt} onComplete={verify} disabled={busy} />
        {alert}
        <p role="status">{notice}</p>
        <p className="auth-note">Or open the link in the email.</p>
        <button type="button" className="auth-link" disabled={busy} onClick={() => request(email, "We sent a new link and code.")}>
          Send a new code
        </button>
        <button type="button" className="auth-link" onClick={() => { setEmail(null); setError(null); setNotice(null); }}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="auth-options">
      <h1>{signIn ? "Sign in to OpsAgent" : "Create your OpsAgent account"}</h1>
      {alert}
      {signIn ? passkeySlot : null}
      <button type="button" className="auth-btn" disabled={busy} onClick={() => provider("google")}>Continue with Google</button>
      <button type="button" className="auth-btn" disabled={busy} onClick={() => provider("github")}>Continue with GitHub</button>
      <p className="auth-or">or</p>
      <form onSubmit={send}>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <button type="submit" className={signIn ? "auth-btn" : "auth-btn primary"} disabled={busy}>Send link and code</button>
      </form>
      {signIn ? null : <p className="auth-note">After you sign in we&apos;ll suggest adding a passkey, so next time is one tap.</p>}
      <p className="auth-foot">
        {signIn ? <>New here? <Link href={`/sign-up${keep}`}>Create an account</Link></> : <>Already have an account? <Link href={`/sign-in${keep}`}>Sign in</Link></>}
      </p>
    </div>
  );
}
