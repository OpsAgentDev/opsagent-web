import { describe, expect, it } from "vitest";
import { accountText, connectionSentence, scheduleText } from "@/lib/connection-status";
import { deliveryStatusText } from "@/lib/delivery";
import { findingsSummary } from "@/lib/findings";
import { showPasskeyPrompt } from "@/lib/passkey-scope";
import { openTotal } from "@/lib/scan";

const sev = (...s: string[]) => s.map((severity) => ({ severity }));

describe("findingsSummary", () => {
  it("counts the page when it holds everything", () => {
    const items = sev("critical", "critical", "high", "low");
    expect(findingsSummary(items, { more: false, status: "open" })).toBe("4 open findings · 2 critical · 1 high");
  });
  it("uses the singular and drops the status word for all", () => {
    expect(findingsSummary(sev("low"), { more: false, status: "open" })).toBe("1 open finding · 0 critical · 0 high");
    expect(findingsSummary(sev("low", "info"), { more: false, status: "" })).toBe("2 findings · 0 critical · 0 high");
  });
  it("shows no numbers when more pages exist", () => {
    expect(findingsSummary(sev("critical"), { more: true, status: "open" })).toBe("Open findings, most severe first.");
    expect(findingsSummary(sev("critical"), { more: true, status: "" })).toBe("Findings, most severe first.");
  });
  it("is empty for an empty list", () => {
    expect(findingsSummary([], { more: false, status: "open" })).toBeNull();
  });
});

describe("openTotal", () => {
  it("sums the counts and is null when the run reported none", () => {
    expect(openTotal({ counts_by_severity: { critical: 2, low: 3 } })).toBe(5);
    expect(openTotal({})).toBeNull();
  });
});

describe("connection text", () => {
  it("has a sentence per status, the reason for degraded, and raw text for unknown", () => {
    expect(connectionSentence("verifying")).toMatch(/under a minute/);
    expect(connectionSentence("connected")).toMatch(/every night/);
    expect(connectionSentence("degraded", "Missing ec2:Describe")).toBe("Missing ec2:Describe");
    expect(connectionSentence("degraded")).toBe("Some checks can't read this account right now.");
    expect(connectionSentence("revoked")).toMatch(/Reconnect/);
    expect(connectionSentence("disconnected")).toBe("This connection is turned off.");
    expect(connectionSentence("wibble")).toBeNull();
  });
  it("shows the default schedule in words and keeps a custom one", () => {
    expect(scheduleText(null)).toBe("Organisation default");
    expect(scheduleText("default")).toBe("Organisation default");
    expect(scheduleText("03:30")).toBe("03:30");
  });
  it("says when the account is not known", () => {
    expect(accountText(null)).toBe("Not known yet");
    expect(accountText("123456789012")).toBe("123456789012");
  });
});

describe("deliveryStatusText", () => {
  it("maps known statuses and passes unknown through", () => {
    expect(deliveryStatusText("sent")).toBe("Sent");
    expect(deliveryStatusText("failed")).toBe("Failed");
    expect(deliveryStatusText("fallback_email")).toBe("Sent by email (Slack not connected)");
    expect(deliveryStatusText("skipped")).toBe("Skipped");
    expect(deliveryStatusText("pending")).toBe("Waiting");
    expect(deliveryStatusText("weird")).toBe("weird");
  });
});

describe("showPasskeyPrompt", () => {
  const base = { hasPasskey: false, checklistOpen: null as boolean | null };
  it("never shows once a passkey exists", () => {
    expect(showPasskeyPrompt({ ...base, hasPasskey: true, pathname: "/settings/security" })).toBe(false);
  });
  it("shows on security settings whatever the checklist says", () => {
    expect(showPasskeyPrompt({ ...base, pathname: "/settings/security" })).toBe(true);
    expect(showPasskeyPrompt({ ...base, checklistOpen: true, pathname: "/settings/security" })).toBe(true);
  });
  it("shows on the dashboard only once the checklist is known to be closed", () => {
    expect(showPasskeyPrompt({ ...base, pathname: "/dashboard" })).toBe(false);
    expect(showPasskeyPrompt({ ...base, checklistOpen: true, pathname: "/dashboard" })).toBe(false);
    expect(showPasskeyPrompt({ ...base, checklistOpen: false, pathname: "/dashboard" })).toBe(true);
  });
  it("shows nowhere else", () => {
    for (const p of ["/findings", "/onboarding/connect-aws", "/connections/1", "/settings/billing", "/deliveries"]) {
      expect(showPasskeyPrompt({ ...base, checklistOpen: false, pathname: p })).toBe(false);
    }
  });
});
