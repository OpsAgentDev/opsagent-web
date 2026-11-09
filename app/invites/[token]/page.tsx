"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { inviteProblem, inviteSignInUrl } from "@/lib/members";
import { useApi } from "@/lib/use-api";

// An explicit button, not an accept on load: mail scanners prefetch links.
export default function Invite() {
  const { token } = useParams<{ token: string }>();
  const { data: me, error: meError } = useApi(() => unwrap(api.GET("/auth/me")), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const signedOut = meError instanceof ApiError && meError.status === 401;

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      await unwrap(api.POST("/invites/{token}/accept", { params: { path: { token } } }));
      window.location.href = "/dashboard"; // full load: the dashboard layout re-reads the session
    } catch (err) {
      setError(err as Error);
      setBusy(false);
    }
  }

  const problem = inviteProblem(error);
  return (
    <main className="stack">
      <h1>Join an OpsAgent team</h1>
      {signedOut ? (
        <>
          <p>Sign in with the email address this invite was sent to, then you can accept it.</p>
          <p><Link href={inviteSignInUrl(token)}>Sign in to accept</Link></p>
        </>
      ) : meError ? (
        <ErrorNote error={meError} />
      ) : !me ? (
        <p className="muted" role="status">Loading…</p>
      ) : (
        <>
          <p>You are signed in as {me.email}. Accept to join the team.</p>
          <button type="button" onClick={accept} disabled={busy || !!problem}>Accept invite</button>
          {problem ? <p role="alert" className="error">{problem}</p> : <ErrorNote error={error} />}
        </>
      )}
    </main>
  );
}
