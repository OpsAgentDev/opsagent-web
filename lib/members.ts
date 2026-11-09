// Words and links for invites and the Members page.
import { ApiError } from "@/lib/api/client";

/** Brain lists members to everyone but only owners may invite or remove; say so. */
export function membersScopeNote(role?: string | null): string | null {
  return role === "owner" ? null : "Only an owner can invite or remove people.";
}

/** Sign-in address that returns to the invite page (same-site relative path; sign-in re-checks it). */
export function inviteSignInUrl(token: string): string {
  return `/sign-in?return_to=${encodeURIComponent(`/invites/${token}`)}`;
}

/** Plain sentence for a failed accept. 401 is handled by the page (sign in); billing codes fall to ErrorNote. */
export function inviteProblem(err: unknown): string | null {
  if (!(err instanceof ApiError)) return null;
  if (err.code === "invite_email_mismatch") return "This invite was sent to a different email address. Sign in with the address it was sent to.";
  // Brain answers 410 for expired, used and unknown tokens alike; 404/409 are treated the same.
  if ([404, 409, 410].includes(err.status)) return "This invite link has expired, was already used, or isn't valid. Ask the owner to send a new invite.";
  return null;
}
