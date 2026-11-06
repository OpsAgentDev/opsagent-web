"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CodeInput } from "@/components/auth/code-input";
import { MailIcon } from "@/components/auth/icons";
import { Turnstile } from "@/components/auth/turnstile";
import { useAuthStep } from "@/components/auth/use-auth-step";
import { api, unwrap } from "@/lib/api/client";
import { cleanName } from "@/lib/person-name";
import { isSameOrigin } from "@/lib/safe-redirect";
import { submitDisabled, TURNSTILE_SITE_KEY } from "@/lib/turnstile";

type Props = { mode: "sign-up" | "sign-in"; returnTo?: string };

/** Email sign-in or sign-up: the form, then the link-and-code step on the same page. */
export function EmailForm({ mode, returnTo }: Props) {
  const { busy, setBusy, error, setError, run } = useAuthStep(returnTo);
  const [email, setEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0); // a Turnstile token is single use: reset after every request
  const [codeKey, setCodeKey] = useState(0); // remounts (clears and refocuses) the code input
  const signUp = mode === "sign-up";
  const back = `/${mode}${returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ""}`;
  const blocked = submitDisabled({ busy, siteKey: TURNSTILE_SITE_KEY, token });

  const request = (address: string, name: string | null, sent?: string) =>
    run(async () => {
      try {
        await unwrap(api.POST("/auth/magic-link", {
          body: { email: address, return_to: returnTo, name, turnstile_token: token },
        }));
      } finally {
        setToken(null);
        setResetKey((n) => n + 1);
      }
      setEmail(address);
      setNotice(sent ?? null);
      setCodeKey((n) => n + 1);
      setBusy(false);
    });

  function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (blocked) return;
    const f = new FormData(e.currentTarget);
    const name = signUp ? cleanName(String(f.get("name") ?? "")) : null;
    if (signUp && !name) return setError("Enter your name, up to 80 characters.");
    void request(String(f.get("email")), name);
  }

  const verify = (code: string) =>
    run(async () => {
      try {
        const { redirect } = await unwrap(api.POST("/auth/magic-link/verify", { body: { email: email ?? "", code } }));
        if (!isSameOrigin(redirect, window.location.origin)) throw new Error("Unexpected sign-in redirect.");
        window.location.assign(redirect);
      } catch (err) {
        setCodeKey((n) => n + 1); // a wrong code clears the input and focuses it again
        throw err;
      }
    });

  const alert = error ? <p role="alert" className="error">{error}</p> : null;
  const widget = <Turnstile onToken={setToken} resetKey={resetKey} />;

  if (email) {
    return (
      <div className="auth-options">
        <h1>Check your email</h1>
        <p>We sent a sign-in code to <strong className="auth-addr">{email}</strong>. It works once and expires in 15 minutes.</p>
        <CodeInput key={codeKey} onComplete={verify} disabled={busy} />
        {alert}
        {notice ? <p role="status">{notice}</p> : null}
        <p className="auth-note">Or open the link in the email.</p>
        {widget}
        <button type="button" className="auth-link" disabled={blocked} onClick={() => request(email, null, "We sent a new link and code.")}>
          Send a new code
        </button>
        <button type="button" className="auth-link" onClick={() => { setEmail(null); setError(null); setNotice(null); setToken(null); }}>
          Use a different email
        </button>
        <Link href={back} className="auth-link">Back to all options</Link>
      </div>
    );
  }

  return (
    <div className="auth-options">
      <h1>{signUp ? "Create your account" : "Sign in with email"}</h1>
      {alert}
      <form onSubmit={send}>
        {signUp ? (
          <label>
            Name
            <input name="name" required maxLength={80} autoComplete="name" placeholder="Your name" />
          </label>
        ) : null}
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
        </label>
        {widget}
        <button type="submit" className={signUp ? "auth-btn primary" : "auth-btn"} disabled={blocked}><MailIcon />Send link and code</button>
      </form>
      <Link href={back} className="auth-link">Back to all options</Link>
    </div>
  );
}
