"use client";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { forgetChoices } from "@/lib/members";

/** True once the session is over. A 403 is retried once: the client drops a stale CSRF token on it. */
async function endSession(): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { response } = await api.POST("/auth/sign-out");
    if (response.ok || response.status === 401) return true; // 401: already signed out
    if (response.status !== 403) return false;
  }
  return false;
}

/** Ends the session, then loads the home page. Stays put and says so if the session could not be ended. */
export function SignOut({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  async function out() {
    setFailed(false);
    if (!(await endSession().catch(() => false))) {
      setFailed(true);
      return;
    }
    forgetChoices();
    window.location.href = "/";
  }

  return (
    <>
      <button type="button" className={className} onClick={out}>Sign out</button>
      {failed && <span role="alert" className="error">Sign-out failed. Try again.</span>}
    </>
  );
}
