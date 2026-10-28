import { ApiError } from "@/lib/api/client";

// Sentences for brain's sign-in error codes: from `?error=` after a provider callback, or an API problem.
const MESSAGES = new Map<string, string>([
  ["oauth_state", "Sign-in took too long or was opened in another tab. Try again."],
  ["oauth_exchange", "The provider didn't confirm your sign-in. Try again."],
  ["oauth_denied", "Sign-in was cancelled. Try again or choose another option."],
  ["github_no_verified_email", "That account has no verified email address."],
  ["google_no_verified_email", "That account has no verified email address."],
  ["account_exists", "An OpsAgent account already uses this email. Sign in with email instead."],
  ["google_email_unmanaged", "Google doesn't manage this email address. Use email sign-in instead."],
  ["code_invalid", "That code didn't work. Check the latest email or send a new one."],
  ["passkey_invalid", "That passkey isn't registered with OpsAgent."],
  ["passkey_no_ceremony", "Start passkey sign-in again."],
  ["google_not_configured", "Google sign-in isn't available yet."],
  ["github_not_configured", "GitHub sign-in isn't available yet."],
  ["rate_limited", "Too many attempts. Wait a few minutes and try again."],
]);

export function messageFor(code: string): string {
  return MESSAGES.get(code) ?? "Sign-in failed. Try again.";
}

/** An API failure's sentence (any 429 reads as rate_limited); anything else gets the default. */
export function authMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return messageFor("");
  return messageFor(err.status === 429 ? "rate_limited" : (err.code ?? ""));
}

/** The digits of a typed or pasted code ("123 456", "123-456"), at most six. */
export function codeDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

const PROVIDERS = new Set(["https://accounts.google.com", "https://github.com"]);

/** True only for a Google or GitHub authorize URL, so a tampered start response can't send the browser elsewhere. */
export function isProviderUrl(url: string): boolean {
  try {
    return PROVIDERS.has(new URL(url).origin);
  } catch {
    return false;
  }
}
