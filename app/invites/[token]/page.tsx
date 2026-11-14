"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { SignOut } from "@/components/sign-out";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { inviteProblem, inviteSignInUrl, preferOrg, rememberInvite } from "@/lib/members";
import { SIGNUPS_OPEN } from "@/lib/signups";
import { useApi } from "@/lib/use-api";

// An explicit button, not an accept on load: mail scanners prefetch links.
export default function Invite() {
  // Held in state: the effect below removes it from the address bar and history.
  const [token] = useState(useParams<{ token: string }>().token);
  useEffect(() => {
    window.history.replaceState(null, "", "/invites");
  }, []);
  const { data: me, error: meError } = useApi(() => unwrap(api.GET("/auth/me")), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const signedOut = meError instanceof ApiError && meError.status === 401;

  useEffect(() => {
    if (signedOut) rememberInvite(token);
  }, [signedOut, token]);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const joined = await unwrap(api.POST("/invites/{token}/accept", { params: { path: { token } } }));
      preferOrg(joined.slug);
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
          {!SIGNUPS_OPEN && <p className="muted">While sign-ups are closed, only approved addresses can create a new account.</p>}
          <p><Link href={inviteSignInUrl(token)}>Sign in to accept</Link></p>
        </>
      ) : meError ? (
        <ErrorNote error={meError} showCode={false} />
      ) : !me ? (
        <p className="muted" role="status">Loading…</p>
      ) : (
        <>
          <p>You are signed in as {me.email}. Accept to join the team.</p>
          <button type="button" onClick={accept} disabled={busy || !!problem}>Accept invite</button>
          {problem ? <p role="alert" className="error">{problem}</p> : <ErrorNote error={error} showCode={false} />}
          {error instanceof ApiError && error.code === "invite_email_mismatch" && <SignOut />}
        </>
      )}
    </main>
  );
}
