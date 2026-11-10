"use client";
import { useEffect, useState } from "react";
import { ConfirmAction } from "@/components/confirm-action";
import createClient from "openapi-fetch";
import { API_BASE_URL, ApiError, unwrap } from "@/lib/api/client";
import type { paths } from "@/lib/api/schema";

// Anonymous, like the waitlist form: a visitor has no session, so no cookies and no CSRF token.
const anon = createClient<paths>({ baseUrl: `${API_BASE_URL}/v1`, credentials: "omit" });

const INVALID =
  "This link was already used or isn't valid. If you already confirmed, you're on the list. Otherwise, join again from the home page.";

/** The waitlist confirmation link: `/waitlist/verify#<token>`. Confirms on a click, never on load. */
export default function WaitlistVerify() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setToken(window.location.hash.slice(1));
    // The token stays in memory only: off the address bar and out of history.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function confirm() {
    try {
      await unwrap(anon.POST("/waitlist/verify", { body: { token: token ?? "" } }));
    } catch (err) {
      throw err instanceof ApiError && err.status === 410 ? new Error(INVALID) : err;
    }
  }

  return (
    <main>
      <h1>Confirm your email</h1>
      <p>Confirm this address to join the OpsAgent waitlist. We&apos;ll email you once when sign-ups open.</p>
      {token === null ? null : token === "" ? (
        <p className="error" role="alert">{INVALID}</p>
      ) : (
        <ConfirmAction label="Confirm my email" done="You're on the list. We'll email you once when sign-ups open." run={confirm} />
      )}
    </main>
  );
}
