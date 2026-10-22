"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";

// A button, not an auto-POST on load: a link someone else sent cannot sign you into their account.
function Confirm() {
  const token = useSearchParams().get("token") ?? "";
  const [error, setError] = useState<Error | null>(null);

  async function redeem() {
    try {
      const { redirect } = await unwrap(api.POST("/auth/magic-link/redeem", { body: { token } }));
      window.location.assign(redirect);
    } catch (err) {
      setError(err as Error);
    }
  }

  if (!token) return <p className="error">This sign-in link is incomplete.</p>;
  return (
    <div className="stack">
      <button type="button" onClick={redeem}>
        Sign in
      </button>
      <ErrorNote error={error} />
    </div>
  );
}

export default function Callback() {
  return (
    <main>
      <h1>Sign in to OpsAgent</h1>
      <Suspense>
        <Confirm />
      </Suspense>
    </main>
  );
}
