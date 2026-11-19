// Plain-language text for the connection page. Unknown statuses return null so the caller can show the raw value.
const SENTENCES: Record<string, string> = {
  pending: "Waiting to be verified.",
  verifying: "Checking the role. This usually takes under a minute.",
  connected: "Connected. OpsAgent checks this account every night and urgent issues every 15 minutes.",
  revoked: "The role no longer works. Reconnect to resume checks.",
  disconnected: "This connection is turned off.",
};

// Brain's machine codes in plain words. Empty means the status sentence already says enough.
const REASONS: Record<string, string> = {
  account_already_connected:
    "This AWS account is already connected to another OpsAgent organisation, and an account can belong to only one. Remove this connection, or disconnect the account there first.",
  external_id_not_enforced:
    "This role doesn't require OpsAgent's ExternalId, so it isn't safe to use. Create the role from the OpsAgent template.",
  account_mismatch: "This role belongs to a different AWS account from the one connected. Remove this connection and connect again.",
  access_denied: "AWS refused access to the role.",
  revoked_at_period_end:
    "Its role stopped working, so it was turned off before the next billing period and isn't charged. Reconnect to resume checks.",
  customer_disconnected: "",
  organisation_deleted: "",
};

const PENDING_REFUSED = "AWS refused access to this role. Check that the stack finished and that you pasted its RoleArn output, then verify again.";

/** A customer-readable reason. Codes we don't know are hidden; text that is already a sentence passes through. */
export function reasonText(reason?: string | null): string {
  if (!reason) return "";
  const known = Object.hasOwn(REASONS, reason) ? REASONS[reason] : undefined;
  if (known !== undefined) return known;
  if (reason.startsWith("verify_error:")) return "The last check couldn't finish. Try again in a few minutes.";
  return /^[a-z0-9_:.-]+$/.test(reason) ? "" : reason;
}

/** Lost its role: reconnecting brings it back. A connection turned off for that at the period end counts too. */
export const canReconnect = (c: { status: string; status_reason?: string | null }) =>
  c.status === "revoked" || (c.status === "disconnected" && c.status_reason === "revoked_at_period_end");

export function connectionSentence(status: string, reason?: string | null): string | null {
  const why = reasonText(reason);
  if (status === "degraded") return why || "Some checks can't read this account right now.";
  if (status === "blocked") return why || "OpsAgent couldn't use this role. Check it was created from the OpsAgent template.";
  // Refused before it ever connected: say what to check, not just that it is waiting.
  if (status === "pending" && reason === "access_denied") return PENDING_REFUSED;
  const s = SENTENCES[status];
  // Keep the reason brain gives for a lost connection beside the plain sentence.
  return s && why && (status === "revoked" || status === "disconnected") ? `${s} ${why}` : (s ?? null);
}

const OUTCOMES: Record<string, string> = {
  connected: "Connected",
  degraded: "Connected, some permissions missing",
  blocked: "The role could not be used",
  access_denied: "AWS refused access",
  revoked: "Access was lost",
  error: "The check could not finish",
};

/** The last verification's result in plain words; a code we don't know is shown as it is. */
export const outcomeText = (outcome: string) => (Object.hasOwn(OUTCOMES, outcome) ? OUTCOMES[outcome] : undefined) ?? outcome;

/** `default` (or nothing) means the organisation's schedule; a custom time stays as is. */
export const scheduleText = (v?: string | null) => (!v || v === "default" ? "Organisation default" : v);

export const accountText = (id?: string | null) => id || "Not known yet";

/** True only for an AWS console URL; the "Launch stack" link must not go anywhere else. */
export function isAwsConsoleUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && (u.hostname === "console.aws.amazon.com" || u.hostname.endsWith(".console.aws.amazon.com"));
  } catch {
    return false;
  }
}

/** A connection removed before it ever connected has nothing to show: no findings, no history. */
export const neverConnected = (c: { status: string; first_connected_at?: string | null }) =>
  c.status === "disconnected" && !c.first_connected_at;
