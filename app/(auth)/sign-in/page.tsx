"use client";
import { useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";

export default function SignIn() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    // Brain keeps only /oauth/consent?request_id=<uuid>; anything else is dropped there.
    const return_to = new URLSearchParams(window.location.search).get("return_to");
    try {
      await unwrap(api.POST("/auth/magic-link", { body: { email, return_to } }));
      setSent(true);
    } catch (err) {
      setError(err as Error);
    }
  }

  return (
    <main>
      <h1>Sign in</h1>
      {sent ? (
        <p>Check your email for a sign-in link. It works once and expires in 15 minutes.</p>
      ) : (
        <form className="stack" onSubmit={submit}>
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <button type="submit">Send sign-in link</button>
          <ErrorNote error={error} />
        </form>
      )}
    </main>
  );
}
