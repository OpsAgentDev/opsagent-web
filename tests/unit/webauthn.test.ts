import { describe, expect, it } from "vitest";
import { cancelled, fromBase64url, isDismissed, readDismissedAt, toBase64url } from "@/lib/webauthn";

const DAY = 24 * 60 * 60 * 1000;

describe("webauthn", () => {
  it("base64url round trip", () => {
    const bytes = new Uint8Array([0, 1, 62, 63, 250, 251, 254, 255, 128]);
    const text = toBase64url(bytes);
    expect(text).not.toMatch(/[+/=]/);
    expect(new Uint8Array(fromBase64url(text))).toEqual(bytes);
    expect(toBase64url(new Uint8Array([251, 255]))).toBe("-_8");
  });
  it("cancelled detects NotAllowedError", () => {
    expect(cancelled(new DOMException("x", "NotAllowedError"))).toBe(true);
    expect(cancelled(new DOMException("x", "AbortError"))).toBe(true);
    expect(cancelled(new DOMException("x", "InvalidStateError"))).toBe(false);
    expect(cancelled(new Error("x"))).toBe(false);
  });
  it("promptDismissed respects 30 days", () => {
    const now = Date.now();
    expect(isDismissed(now - 29 * DAY, now)).toBe(true);
    expect(isDismissed(now - 31 * DAY, now)).toBe(false);
    expect(isDismissed(null, now)).toBe(false);
  });

  it("readDismissedAt treats blocked storage as not dismissed", () => {
    const blocked = { getItem: () => { throw new DOMException("blocked", "SecurityError"); } };
    expect(readDismissedAt(blocked)).toBeNull();
    expect(readDismissedAt({ getItem: () => "123" })).toBe(123);
  });
});
