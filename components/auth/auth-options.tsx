"use client";
import Link from "next/link";
import { useAuthStep } from "@/components/auth/use-auth-step";
import { PasskeyButton } from "@/components/auth/passkey-button";
import { GitHubIcon, GoogleIcon, MailIcon } from "@/components/auth/icons";
import { api, unwrap } from "@/lib/api/client";
import { isProviderUrl } from "@/lib/auth-errors";

type Props = {
  mode: "sign-up" | "sign-in";
  /** Brain keeps only /oauth/consent?request_id=<uuid>; anything else is dropped there. */
  returnTo?: string;
  /** A provider callback's `?error=` code. */
  error?: string;
};

export function AuthOptions({ mode, returnTo, error: initialError }: Props) {
  const { busy, signedIn, error, run } = useAuthStep(returnTo, initialError);
  const query = { return_to: returnTo };
  const keep = returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : "";

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

  const signIn = mode === "sign-in";
  if (signedIn) {
    return (
      <div className="auth-options">
        <h1>{signIn ? "Sign in" : "Create your account"}</h1>
        <p role="status">You&apos;re already signed in. Opening your dashboard…</p>
      </div>
    );
  }
  return (
    <div className="auth-options">
      <h1>{signIn ? "Sign in" : "Create your account"}</h1>
      {error ? <p role="alert" className="error">{error}</p> : null}
      {signIn ? <PasskeyButton returnTo={returnTo} disabled={busy} /> : null}
      <button type="button" className="auth-btn" disabled={busy} onClick={() => provider("google")}><GoogleIcon />Continue with Google</button>
      <button type="button" className="auth-btn" disabled={busy} onClick={() => provider("github")}><GitHubIcon />Continue with GitHub</button>
      <Link href={`/${mode}/email${keep}`} className="auth-btn"><MailIcon />Continue with email</Link>
      {signIn ? null : <p className="auth-note">You&apos;ll agree to the Terms on the next step. Then we&apos;ll suggest adding a passkey, so next time is one tap.</p>}
      <p className="auth-foot">
        {signIn ? <>New here? <Link href={`/sign-up${keep}`}>Create an account</Link></> : <>Already have an account? <Link href={`/sign-in${keep}`}>Sign in</Link></>}
      </p>
    </div>
  );
}
