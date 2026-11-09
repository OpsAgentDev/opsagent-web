"use client";
import { api } from "@/lib/api/client";
import { forgetChoices } from "@/lib/members";

/** Ends the session, then loads the home page. */
export function SignOut({ className }: { className?: string }) {
  async function out() {
    try {
      await api.POST("/auth/sign-out");
    } finally {
      forgetChoices();
      window.location.href = "/";
    }
  }
  return <button type="button" className={className} onClick={out}>Sign out</button>;
}
