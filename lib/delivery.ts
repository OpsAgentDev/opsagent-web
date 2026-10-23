// Pure helpers for the delivery settings and history pages.
import type { components } from "./api/schema";

type Schemas = components["schemas"];

/** Unsubscribed rows stay in brain for the audit trail; settings shows only live recipients. */
export function liveRecipients<T extends { unsubscribed_at?: string | null }>(items: T[]): T[] {
  return items.filter((r) => !r.unsubscribed_at);
}

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
export function slackResult(params: URLSearchParams): { ok: boolean; message: string } | null {
  const slack = params.get("slack");
  if (slack === "connected") return { ok: true, message: "Slack connected." };
  if (slack !== "error") return null;
  const code = params.get("code");
  // The code comes from the URL, so only show well-formed ones; a crafted link must not display its own text.
  return { ok: false, message: `Slack was not connected${code && /^[a-z0-9_]{1,40}$/.test(code) ? ` (${code})` : ""}.` };
}

/** True only for an https://slack.com URL; the OAuth redirect must not go anywhere else. */
export function isSlackUrl(url: string): boolean {
  try {
    return new URL(url).origin === "https://slack.com";
  } catch {
    return false;
  }
}
