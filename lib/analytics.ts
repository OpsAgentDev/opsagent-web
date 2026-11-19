/** Build-time switch (NEXT_PUBLIC_GA_ID=G-...): Google Analytics on the public pages, loaded only after the visitor accepts. Unset: no banner and nothing loads. */
export const gaId = (raw: string | undefined) => (/^G-[A-Z0-9]{4,20}$/.test(raw ?? "") ? (raw as string) : "");
/** Empty unless the build value is a GA4 Measurement ID; anything else leaves analytics off. */
export const GA_ID = gaId(process.env.NEXT_PUBLIC_GA_ID);

export const CONSENT_KEY = "analytics-consent";
/** Fired by the footer's "Cookie settings" to show the banner again. */
export const CONSENT_OPEN_EVENT = "analytics-consent-open";
export type Consent = "granted" | "denied";

/** The stored answer, or null when the visitor has not answered (or the value is not ours). */
export const consentOf = (stored: string | null): Consent | null =>
  stored === "granted" || stored === "denied" ? stored : null;

/** Google Analytics' own cookies among `document.cookie` names: removed when consent is withdrawn. */
export const gaCookies = (cookie: string) =>
  cookie.split(";").map((c) => (c.split("=")[0] ?? "").trim()).filter((n) => n === "_ga" || n.startsWith("_ga_"));
