// Plain-language text for the connection page. Unknown statuses return null so the caller can show the raw value.
const SENTENCES: Record<string, string> = {
  verifying: "Checking the role. This usually takes under a minute.",
  connected: "Connected. OpsAgent checks this account every night and urgent issues every 15 minutes.",
  revoked: "The role no longer works. Reconnect to resume checks.",
  disconnected: "This connection is turned off.",
};

export function connectionSentence(status: string, reason?: string | null): string | null {
  if (status === "degraded") return reason || "Some checks can't read this account right now.";
  return SENTENCES[status] ?? null;
}

/** `default` (or nothing) means the organisation's schedule; a custom time stays as is. */
export const scheduleText = (v?: string | null) => (!v || v === "default" ? "Organisation default" : v);

export const accountText = (id?: string | null) => id || "Not known yet";
