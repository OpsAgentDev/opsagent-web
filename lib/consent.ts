// Pure helpers for the OAuth consent page.
import type { components } from "./api/schema";

type View = components["schemas"]["ConsentView"];

export const LOOPBACK_WARNING = "Only approve if you started this on your own computer.";
export const EXPIRED_MESSAGE = "This request expired. Start the connection again from your AI tool.";
export const WRONG_BROWSER_MESSAGE = "Start the connection again from your AI tool on this device.";

export const UNVERIFIED_WARNING = "Unverified client: this app registered itself, so OpsAgent can't confirm its name.";

/**
 * The warnings shown above the buttons, in order. A published client's name is still self-asserted
 * (anyone can host a document calling itself "Codex"), so it stays warned, naming the host instead.
 */
export function consentWarnings(view: Pick<View, "verified" | "loopback" | "publisher">): string[] {
  const out: string[] = [];
  if (!view.verified) {
    out.push(view.publisher ? `Published by ${view.publisher}. Only approve if you trust this site.` : UNVERIFIED_WARNING);
  }
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

const UNSAFE_SCHEMES = new Set(["javascript:", "data:", "vbscript:", "blob:", "file:"]);

/** Brain validates redirect URIs at registration; this refuses script-bearing schemes anyway. */
export function safeClientRedirect(target: string): boolean {
  try {
    return !UNSAFE_SCHEMES.has(new URL(target).protocol);
  } catch {
    return false;
  }
}
