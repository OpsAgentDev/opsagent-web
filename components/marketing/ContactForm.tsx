"use client";

import { useEffect, useRef, useState } from "react";
import createClient from "openapi-fetch";
import { Turnstile } from "@/components/auth/turnstile";
import { API_BASE_URL } from "@/lib/api/client";
import type { paths } from "@/lib/api/schema";
import { submitDisabled, TURNSTILE_SITE_KEY } from "@/lib/turnstile";
import { TOPICS, type Topic } from "./contactTopics";

// Anonymous on purpose: not the shared `api` client, so no cookies and no CSRF header.
const anon = createClient<paths>({ baseUrl: `${API_BASE_URL}/v1`, credentials: "omit" });
type State = "idle" | "pending" | "done";

const MESSAGES = {
  invalid: "Please check the fields and try again.",
  limited: "Too many messages. Please try again in a few minutes.",
  failed: "Something went wrong. Please try again later.",
  check: "The security check failed. Reload the page and try again.",
};

export function ContactForm({ initialTopic }: { initialTopic: Topic }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0); // a token is single use
  const blocked = submitDisabled({ busy: state === "pending", siteKey: TURNSTILE_SITE_KEY, token });
  const okRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state === "done") okRef.current?.focus(); }, [state]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (blocked) return;
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const body = { name: get("name"), email: get("email"), topic: get("topic") as Topic, message: get("message"), website: get("website"), turnstile_token: token };
    if (!body.name || !body.email.includes("@") || body.message.length < 10) return setError(MESSAGES.invalid);
    setError("");
    setState("pending");
    try {
      const res = (await anon.POST("/contact", { body })).response;
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
    <div className="contact">
      <div aria-live="polite">
        {state === "done" && <p className="waitlist-ok" ref={okRef} tabIndex={-1}>Thanks. We&apos;ll reply to you by email.</p>}
      </div>
      {state !== "done" && (
        <form onSubmit={submit} noValidate>
          <label htmlFor="c-name">Name</label>
          <input id="c-name" name="name" required maxLength={100} autoComplete="name" placeholder="Your name" />
          <label htmlFor="c-email">Email</label>
          <input id="c-email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
          <label htmlFor="c-topic">Topic</label>
          <select id="c-topic" name="topic" defaultValue={initialTopic}>
            {TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label htmlFor="c-message">Message</label>
          <textarea id="c-message" name="message" required minLength={10} maxLength={5000} rows={6} placeholder="How can we help?" />
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="contact-hp" />
          <Turnstile onToken={setToken} resetKey={resetKey} />
          <button type="submit" aria-disabled={blocked}>Send message</button>
          <p role="alert" className="waitlist-err">{error}</p>
        </form>
      )}
    </div>
  );
}
