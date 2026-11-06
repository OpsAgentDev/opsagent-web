"use client";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { authMessage, messageFor } from "@/lib/auth-errors";
import { log } from "@/lib/log";
import { isSameOrigin } from "@/lib/safe-redirect";

/** Shared by the sign-in and sign-up pages: busy/error state around one step, and the signed-in redirect. */
export function useAuthStep(returnTo?: string, initialError?: string) {
  const [error, setError] = useState(initialError ? messageFor(initialError) : null);
  // Disabled until hydrated: a click before then would be lost, and a native submit would put the email in the URL.
  const [busy, setBusy] = useState(true);
  useEffect(() => setBusy(false), []);
  // Already signed in: brain would answer the buttons with a csrf 403, so leave instead.
  useEffect(() => {
    api.GET("/auth/me").then(({ response }) => {
      if (!response.ok) return;
      window.location.replace(returnTo && isSameOrigin(returnTo, window.location.origin) ? returnTo : "/dashboard");
    }, () => {});
  }, [returnTo]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      log.warn("sign-in step failed", { code: err instanceof ApiError ? err.code : undefined });
      setError(authMessage(err));
      setBusy(false);
    }
  }
  return { busy, setBusy, error, setError, run };
}
