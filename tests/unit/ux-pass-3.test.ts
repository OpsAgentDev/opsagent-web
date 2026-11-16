import { describe, expect, test } from "vitest";
import { canReconnect, connectionSentence, neverConnected, reasonText } from "@/lib/connection-status";

describe("a connection turned off at the period end", () => {
  test("says why in plain words and offers Reconnect", () => {
    expect(reasonText("revoked_at_period_end")).toMatch(/^Its role stopped working, so it was turned off before the next billing period and isn't charged\./);
    expect(connectionSentence("disconnected", "revoked_at_period_end")).toMatch(/^This connection is turned off\. Its role stopped working/);
    expect(canReconnect({ status: "disconnected", status_reason: "revoked_at_period_end" })).toBe(true);
    expect(canReconnect({ status: "revoked", status_reason: "access_denied" })).toBe(true);
    expect(canReconnect({ status: "disconnected", status_reason: "customer_disconnected" })).toBe(false);
    expect(canReconnect({ status: "connected" })).toBe(false);
  });
});

test("only a connection removed before it ever connected is hidden from the dashboard", () => {
  expect(neverConnected({ status: "disconnected", first_connected_at: null })).toBe(true);
  expect(neverConnected({ status: "disconnected", first_connected_at: "2026-10-29T14:38:04Z" })).toBe(false);
  expect(neverConnected({ status: "pending", first_connected_at: null })).toBe(false);
});
