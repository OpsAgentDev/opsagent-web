/** Public by design; unset locally and in e2e, so no widget renders and no token is sent. */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/** How long the security check may take before the form says it did not load. */
export const CHECK_WAIT_MS = 10_000;
export const CHECK_NOT_LOADED = "The security check did not load. Reload the page, or turn off content blockers for this site.";

/**
 * Tells `setLate(true)` when a site key is set and no token came within CHECK_WAIT_MS. Made to be a `useEffect` body
 * keyed on the token: the returned cleanup stops the wait and clears the notice, so it goes away when the token arrives.
 */
export function watchCheck(siteKey: string, token: string | null, setLate: (late: boolean) => void): (() => void) | undefined {
  if (!siteKey || token) return undefined;
  const t = setTimeout(() => setLate(true), CHECK_WAIT_MS);
  return () => { clearTimeout(t); setLate(false); };
}

/** A form's submit is off while it works, and, when a site key is set, until the security check produced a token. */
export function submitDisabled({ busy, siteKey, token }: { busy: boolean; siteKey: string; token: string | null }): boolean {
  return busy || (siteKey !== "" && !token);
}
