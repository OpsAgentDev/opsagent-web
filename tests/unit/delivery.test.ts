import { describe, expect, it } from "vitest";
import { liveRecipients, isSlackUrl, newRecipientBody, slackResult } from "@/lib/delivery";

describe("liveRecipients", () => {
  it("drops unsubscribed rows", () => {
    const rows = [{ id: "a", unsubscribed_at: null }, { id: "b", unsubscribed_at: "2026-10-01T00:00:00Z" }, { id: "c" }];
    expect(liveRecipients(rows).map((r) => r.id)).toEqual(["a", "c"]);
  });
});

describe("newRecipientBody", () => {
  const form = { by: "email", email: " ops@example.com ", member_id: "m1", connection_id: "" };
  it("sends a trimmed email, org-wide when no connection is picked", () =>
    expect(newRecipientBody(form)).toEqual({ email: "ops@example.com", connection_id: null }));
  it("sends only the member for a member recipient, scoped to the picked connection", () =>
    expect(newRecipientBody({ ...form, by: "member", connection_id: "c1" })).toEqual({ member_id: "m1", connection_id: "c1" }));
});

describe("slackResult", () => {
  const q = (s: string) => slackResult(new URLSearchParams(s));
  it("is null without the callback parameter", () => expect(q("")).toBeNull());
  it("reports success", () => expect(q("slack=connected")).toEqual({ ok: true, message: "Slack connected." }));
  it("reports the error code", () =>
    expect(q("slack=error&code=slack_workspace_in_use")).toEqual({ ok: false, message: "Slack was not connected (slack_workspace_in_use)." }));
  it("hides a crafted code", () => expect(q("slack=error&code=Visit%20evil.com%20now")?.message).toBe("Slack was not connected."));
  it("reports an error without a code", () => expect(q("slack=error")?.message).toBe("Slack was not connected."));
});

describe("isSlackUrl", () => {
  it("accepts slack.com over https", () => expect(isSlackUrl("https://slack.com/oauth/v2/authorize?x=1")).toBe(true));
  it.each(["javascript:alert(1)", "https://evil.com/", "http://slack.com/", "https://slack.com.evil.com/", "not a url"])("rejects %s", (u) =>
    expect(isSlackUrl(u)).toBe(false));
});
