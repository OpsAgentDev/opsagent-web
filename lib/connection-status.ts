// Plain-language text for the connection page. Unknown statuses return null so the caller can show the raw value.
const SENTENCES: Record<string, string> = {
  pending: "Waiting to be verified.",
  verifying: "Checking the role. This usually takes under a minute.",
  connected: "Connected. OpsAgent checks this account every night and urgent issues every 15 minutes.",
  revoked: "The role no longer works. Reconnect to resume checks.",
  disconnected: "This connection is turned off.",
};

export function connectionSentence(status: string, reason?: string | null): string | null {
  if (status === "degraded") return reason || "Some checks can't read this account right now.";
  const s = SENTENCES[status];
  // Keep the reason brain gives for a lost connection beside the plain sentence.
  return s && reason && (status === "revoked" || status === "disconnected") ? `${s} ${reason}` : (s ?? null);
}

/** `default` (or nothing) means the organisation's schedule; a custom time stays as is. */
export const scheduleText = (v?: string | null) => (!v || v === "default" ? "Organisation default" : v);

export const accountText = (id?: string | null) => id || "Not known yet";
