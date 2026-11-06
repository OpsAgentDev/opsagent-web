/** Public by design; unset locally and in e2e, so no widget renders and no token is sent. */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/** A form's submit is off while it works, and, when a site key is set, until the security check produced a token. */
export function submitDisabled({ busy, siteKey, token }: { busy: boolean; siteKey: string; token: string | null }): boolean {
  return busy || (siteKey !== "" && !token);
}
