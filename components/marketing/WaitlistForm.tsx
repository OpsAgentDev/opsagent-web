"use client";

import { useEffect, useRef, useState } from "react";
import createClient from "openapi-fetch";
import { API_BASE_URL } from "@/lib/api/client";
import type { paths } from "@/lib/api/schema";

// Anonymous on purpose: not the shared `api` client, so no cookies and no CSRF header.
const anon = createClient<paths>({ baseUrl: `${API_BASE_URL}/v1`, credentials: "omit" });
type State = "idle" | "pending" | "done";

const MESSAGES = {
  invalid: "Enter a valid email address.",
  limited: "Too many tries. Please wait a minute and try again.",
  failed: "Something went wrong. Please try again later.",
};

export function WaitlistForm({ source }: { source: "landing-hero" | "landing-footer" }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const id = `waitlist-${source}`;
  const okRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state === "done") okRef.current?.focus(); }, [state]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "pending") return;
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!email.includes("@")) return setError(MESSAGES.invalid);
    setError("");
    setState("pending");
    try {
      const res = (await anon.POST("/waitlist", { body: { email, source } })).response;
      if (res.ok) return setState("done");
      setError(res.status === 422 ? MESSAGES.invalid : res.status === 429 ? MESSAGES.limited : MESSAGES.failed);
    } catch {
      setError(MESSAGES.failed);
    }
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
            <button type="submit" aria-disabled={state === "pending"}>Join the waitlist</button>
          </div>
          <p role="alert" id={`${id}-err`} className="waitlist-err">{error}</p>
          <p id={`${id}-hint`} className="waitlist-hint">Alpha opens in small groups. No spam; one email when your spot is ready.</p>
        </form>
      )}
    </div>
  );
}
