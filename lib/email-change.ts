import { ApiError } from "@/lib/api/client";

const FALLBACK = "Something went wrong. Try again.";

// Sentences for what brain answers to POST /auth/me/email and /auth/me/email/confirm.
const MESSAGES = new Map<string, string>([
  ["validation", "Enter a valid email address."],
  ["email_unchanged", "That is already your sign-in email."],
  ["email_not_allowed", "OpsAgent isn't open to addresses on that domain yet."],
  ["fresh_sign_in_required", "For your security, sign out and sign in again, then change your email within 15 minutes."],
  ["code_invalid", "That code didn't work. Check the latest email or send a new code."],
  ["email_taken", "That address can no longer be used. Nothing was changed."],
  ["rate_limited", "Too many attempts. Wait a while and try again."],
]);

/** An email-change failure in plain words (any 429 reads as rate_limited); anything else gets the fallback. */
export function emailChangeMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return FALLBACK;
  return MESSAGES.get(err.status === 429 ? "rate_limited" : (err.code ?? "")) ?? FALLBACK;
}
