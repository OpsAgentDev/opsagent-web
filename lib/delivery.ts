// Pure helpers for the delivery settings and history pages.
import type { components } from "./api/schema";

type Schemas = components["schemas"];

/** Unsubscribed rows stay in brain for the audit trail; settings shows only live recipients. */
export function liveRecipients<T extends { unsubscribed_at?: string | null }>(
  items: T[],
): T[] {
  return items.filter((r) => !r.unsubscribed_at);
}

/** A connection's name in delivery lists; a disconnected one (removed, or turned off and still listed) keeps its rows but says so. */
export const connectionLabel = (c: { id: string; display_name?: string | null; status: string }) =>
  `${c.display_name ?? c.id}${c.status === "disconnected" ? " (disconnected)" : ""}`;

/** Connections a new filter or recipient can pick: removed ones are left out. */
export const pickable = <T extends { status: string }>(cs: T[]): T[] => cs.filter((c) => c.status !== "disconnected");

/** Delivery settings are owner-managed; brain returns 403 to members, so the UI hides the controls. */
export const isOwner = (role?: string | null) => role === "owner";

/** The add-recipient form as brain's body: exactly one of email or member, "" scope is org-wide. */
export function newRecipientBody(form: {
  by: string;
  email: string;
  member_id: string;
  connection_id: string;
}): Schemas["NewRecipient"] {
  const connection_id = form.connection_id || null;
  if (form.by === "member") return { member_id: form.member_id, connection_id };
  return { email: form.email.trim(), connection_id };
}

/** The banner for brain's Slack OAuth callback redirect (`?slack=connected` or `?slack=error&code=…`). */
export function slackResult(
  params: URLSearchParams,
): { ok: boolean; message: string } | null {
  const slack = params.get("slack");
  if (slack === "connected") return { ok: true, message: "Slack connected." };
  if (slack !== "error") return null;
  const code = params.get("code");
  // The code comes from the URL, so only show well-formed ones; a crafted link must not display its own text.
  return {
    ok: false,
    message: `Slack was not connected${code && /^[a-z0-9_]{1,40}$/.test(code) ? ` (${code})` : ""}.`,
  };
}

/** True only for an https://slack.com URL; the OAuth redirect must not go anywhere else. */
export function isSlackUrl(url: string): boolean {
  try {
    return new URL(url).origin === "https://slack.com";
  } catch {
    return false;
  }
}

const DELIVERY_STATUS: Record<string, string> = {
  sent: "Sent",
  failed: "Failed",
  fallback_email: "Sent by email instead of Slack",
  skipped: "Skipped",
  pending: "Waiting",
};

const FALLBACK_REASON: Record<string, string> = {
  slack_not_connected: "Sent by email (Slack not connected)",
  no_channel: "Sent by email (no Slack channel set for this connection)",
  slack_failed: "Sent by email (Slack post failed)",
};

/** Human text for a delivery status; an email fallback says why when brain recorded it. A status brain adds later shows as is. */
export const deliveryStatusText = (s: string, fallbackReason?: string | null) =>
  (s === "fallback_email" && fallbackReason && FALLBACK_REASON[fallbackReason]) || DELIVERY_STATUS[s] || s;
