import { CONSENT_KEY, consentOf } from "@/lib/analytics";

/** First-touch sign-up source: kept in a first-party cookie, only after the visitor accepted the analytics banner, and sent when the organisation is created. */
export type SignupSource = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_path: string | null;
};

export const SOURCE_COOKIE = "oa_src";
const MAX_AGE = 90 * 24 * 60 * 60;
const MAX_LEN = 200; // brain cuts at the same length
const KEYS = ["utm_source", "utm_medium", "utm_campaign", "referrer", "landing_path"] as const;
const clip = (v: string | null | undefined) => (v ? v.slice(0, MAX_LEN) : null);

const consented = () => {
  try { return consentOf(localStorage.getItem(CONSENT_KEY)) === "granted"; } catch { return false; }
};

/** Drops the cookie (consent declined or withdrawn). */
export function clearFirstTouch(): void {
  if (typeof document !== "undefined") document.cookie = `${SOURCE_COOKIE}=; Max-Age=0; Path=/`;
}

/** The stored first touch, or null when absent, not ours, or analytics consent is not granted. */
export function readFirstTouch(): SignupSource | null {
  if (typeof document === "undefined" || !consented()) return null;
  const raw = document.cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${SOURCE_COOKIE}=`));
  if (!raw) return null;
  try {
    const v = JSON.parse(decodeURIComponent(raw.slice(SOURCE_COOKIE.length + 1)));
    if (!v || typeof v !== "object") return null;
    return Object.fromEntries(KEYS.map((k) => [k, typeof v[k] === "string" ? clip(v[k]) : null])) as SignupSource;
  } catch {
    return null;
  }
}

/** An external referrer as origin + path (no query, which may carry tokens); null for none, our own site or junk. */
function externalReferrer(url: URL, referrer: string): string | null {
  try {
    const r = new URL(referrer);
    const ours = (h: string) => h === "opsagent.dev" || h.endsWith(".opsagent.dev");
    if (r.hostname === url.hostname || (ours(r.hostname) && ours(url.hostname))) return null;
    if (r.protocol !== "http:" && r.protocol !== "https:") return null;
    return clip(r.origin + r.pathname);
  } catch {
    return null;
  }
}

/** Stores the visit as the first touch unless one is already stored; nothing without analytics consent. */
export function recordFirstTouch(url: URL, referrer: string): void {
  if (typeof document === "undefined" || !consented() || readFirstTouch()) return;
  const q = url.searchParams;
  const source: SignupSource = {
    utm_source: clip(q.get("utm_source")),
    utm_medium: clip(q.get("utm_medium")),
    utm_campaign: clip(q.get("utm_campaign")),
    referrer: externalReferrer(url, referrer),
    landing_path: clip(url.pathname),
  };
  const secure = url.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SOURCE_COOKIE}=${encodeURIComponent(JSON.stringify(source))}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}
