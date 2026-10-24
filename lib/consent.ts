// Pure helpers for the OAuth consent page.
import type { components } from "./api/schema";

type View = components["schemas"]["ConsentView"];

export const LOOPBACK_WARNING = "Only approve if you started this on your own computer.";
export const EXPIRED_MESSAGE = "This request expired. Start the connection again from your AI tool.";
export const WRONG_BROWSER_MESSAGE = "Start the connection again from your AI tool on this device.";

/** The warnings shown above the buttons, in order. */
export function consentWarnings(view: Pick<View, "verified" | "loopback">): string[] {
  const out: string[] = [];
  if (!view.verified) out.push("Unverified client");
  if (view.loopback) out.push(LOOPBACK_WARNING);
  return out;
}

/** With exactly one organisation there is nothing to choose; otherwise the member picks. */
export function defaultOrg(orgs: View["organisations"]): string {
  return (orgs.length === 1 && orgs[0]?.slug) || "";
}

/** The sign-in page's address for a signed-out visit to the consent page. */
export function signInUrl(requestId: string): string {
  return `/sign-in?return_to=${encodeURIComponent(`/oauth/consent?request_id=${requestId}`)}`;
}
