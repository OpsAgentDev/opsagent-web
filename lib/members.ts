// Words and links for invites and the Members page.
import { ApiError } from "@/lib/api/client";

/** Brain lists members to everyone but only owners may invite or remove; say so. */
export function membersScopeNote(role?: string | null): string | null {
  return role === "owner" ? null : "Only an owner can invite or remove people.";
}

/** Sign-in address that returns to the invite page. Brain's return_to keeps only the OAuth consent path, so the page also remembers the token (see rememberInvite). */
export function inviteSignInUrl(token: string): string {
  return `/sign-in?return_to=${encodeURIComponent(`/invites/${token}`)}`;
}

/** Plain sentence for a failed accept. 401 is handled by the page (sign in); billing codes fall to ErrorNote. */
export function inviteProblem(err: unknown): string | null {
  if (!(err instanceof ApiError)) return null;
  if (err.status === 402) return "This team can't add you right now. Ask the owner of the team.";
  if (err.code === "invite_email_mismatch") return "This invite was sent to a different email address. Sign out and sign in with the address it was sent to.";
  // Brain answers 410 for expired, used and unknown tokens alike; 404/409 are treated the same.
  if ([404, 409, 410].includes(err.status)) return "This invite link has expired, was already used, or isn't valid. Ask the owner to send a new invite.";
  return null;
}

// Browser-side memory, because brain drops a return_to that is not the OAuth consent path.
const PENDING = "opsagent.pending-invite";
const ORG = "opsagent.org";
const HOUR = 3_600_000;
const TOKEN = /^[\w-]{8,200}$/;
const store = (): Storage | null => { try { return window.localStorage; } catch { return null; } };

/** Remember the invite a signed-out person opened, so the app can send them back after sign-in. */
export function rememberInvite(token: string): void {
  if (TOKEN.test(token)) store()?.setItem(PENDING, JSON.stringify({ token, at: Date.now() }));
}

/** The remembered invite token (at most an hour old, url-safe only), removed on read. */
export function takePendingInvite(): string | null {
  const s = store();
  try {
    const { token, at } = JSON.parse(s?.getItem(PENDING) ?? "null") ?? {};
    s?.removeItem(PENDING);
    return typeof token === "string" && TOKEN.test(token) && Date.now() - at < HOUR ? token : null;
  } catch {
    s?.removeItem(PENDING);
    return null;
  }
}

/** Make this the organisation the app opens (set after joining one). */
export function preferOrg(slug: string): void { store()?.setItem(ORG, slug); }
export function preferredOrg(): string | null { return store()?.getItem(ORG) ?? null; }
/** Forget both on sign-out. */
export function forgetChoices(): void { store()?.removeItem(PENDING); store()?.removeItem(ORG); }
