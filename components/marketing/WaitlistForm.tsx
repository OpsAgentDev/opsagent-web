"use client";

import { useEffect, useRef, useState } from "react";
import createClient from "openapi-fetch";
import { Turnstile } from "@/components/auth/turnstile";
import { API_BASE_URL } from "@/lib/api/client";
import type { paths } from "@/lib/api/schema";
import { submitDisabled, TURNSTILE_SITE_KEY } from "@/lib/turnstile";

// Anonymous on purpose: not the shared `api` client, so no cookies and no CSRF header.
const anon = createClient<paths>({ baseUrl: `${API_BASE_URL}/v1`, credentials: "omit" });
type State = "idle" | "pending" | "done";

const MESSAGES = {
  invalid: "Enter a valid email address.",
  limited: "Too many tries. Please wait a minute and try again.",
  failed: "Something went wrong. Please try again later.",
  check: "The security check failed. Reload the page and try again.",
};

export function WaitlistForm({ source }: { source: "landing-hero" | "landing-footer" | `feature-${string}` }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0); // a token is single use
  const blocked = submitDisabled({ busy: state === "pending", siteKey: TURNSTILE_SITE_KEY, token });
  const id = `waitlist-${source}`;
  const okRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state === "done") okRef.current?.focus(); }, [state]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (blocked) return;
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!email.includes("@")) return setError(MESSAGES.invalid);
    setError("");
    setState("pending");
    try {
      const res = (await anon.POST("/waitlist", { body: { email, source, turnstile_token: token } })).response;
      if (res.ok) return setState("done");
      setError(res.status === 422 ? MESSAGES.invalid : res.status === 400 ? MESSAGES.check : res.status === 429 ? MESSAGES.limited : MESSAGES.failed);
    } catch {
      setError(MESSAGES.failed);
    }
    setToken(null);
    setResetKey((n) => n + 1);
    setState("idle");
  }

  return (
    <div className="waitlist">
      <div aria-live="polite">
        {state === "done" && <p className="waitlist-ok" ref={okRef} tabIndex={-1}>You&apos;re on the list. We&apos;ll email you when your spot opens.</p>}
      </div>
      {state !== "done" && (
        <form onSubmit={submit} noValidate>
          <label htmlFor={id} className="sr-only">Email address</label>
          <div className="waitlist-row">
            <input id={id} name="email" type="email" required autoComplete="email" aria-invalid={error === MESSAGES.invalid} aria-describedby={error ? `${id}-err ${id}-hint` : `${id}-hint`} placeholder="you@company.com" />
            <button type="submit" aria-disabled={blocked}>Join the waitlist</button>
          </div>
          <Turnstile onToken={setToken} resetKey={resetKey} />
          <p role="alert" id={`${id}-err`} className="waitlist-err">{error}</p>
          <p id={`${id}-hint`} className="waitlist-hint">Alpha opens in small groups. No spam; one email when your spot is ready.</p>
        </form>
      )}
    </div>
  );
}
