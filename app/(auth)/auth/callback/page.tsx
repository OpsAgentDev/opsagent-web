"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";
import { isSameOrigin } from "@/lib/safe-redirect";

// A button, not an auto-POST on load: a link someone else sent cannot sign you into their account.
function Confirm() {
  // Held in state: the effect below removes it from the address bar and history.
  const [token] = useState(useSearchParams().get("token") ?? "");
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function redeem() {
    try {
      const { redirect } = await unwrap(api.POST("/auth/magic-link/redeem", { body: { token } }));
      if (!isSameOrigin(redirect, window.location.origin)) throw new Error("Unexpected sign-in redirect.");
      window.location.assign(redirect);
    } catch (err) {
      setError(err as Error);
    }
  }

  if (!token) return <p className="error">This sign-in link is incomplete.</p>;
  return (
    <div className="auth-options">
      <button type="button" className="auth-btn primary" onClick={redeem}>
        Sign in
      </button>
      <ErrorNote error={error} />
    </div>
  );
}

export default function Callback() {
  return (
    <main className="auth">
      <h1>Sign in to OpsAgent</h1>
      <Suspense>
        <Confirm />
      </Suspense>
    </main>
  );
}
