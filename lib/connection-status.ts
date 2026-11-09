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
  customer_disconnected: "",
  organisation_deleted: "",
};

/** A customer-readable reason. Codes we don't know are hidden; text that is already a sentence passes through. */
export function reasonText(reason?: string | null): string {
  if (!reason) return "";
  const known = Object.hasOwn(REASONS, reason) ? REASONS[reason] : undefined;
  if (known !== undefined) return known;
  if (reason.startsWith("verify_error:")) return "The last check couldn't finish. Try again in a few minutes.";
  return /^[a-z0-9_:.-]+$/.test(reason) ? "" : reason;
}

export function connectionSentence(status: string, reason?: string | null): string | null {
  const why = reasonText(reason);
  if (status === "degraded") return why || "Some checks can't read this account right now.";
  if (status === "blocked") return why || "OpsAgent couldn't use this role. Check it was created from the OpsAgent template.";
  const s = SENTENCES[status];
  // Keep the reason brain gives for a lost connection beside the plain sentence.
  return s && why && (status === "revoked" || status === "disconnected") ? `${s} ${why}` : (s ?? null);
}

/** `default` (or nothing) means the organisation's schedule; a custom time stays as is. */
export const scheduleText = (v?: string | null) => (!v || v === "default" ? "Organisation default" : v);

export const accountText = (id?: string | null) => id || "Not known yet";
