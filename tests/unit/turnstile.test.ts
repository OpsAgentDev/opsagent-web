import { describe, expect, it } from "vitest";
import { submitDisabled } from "@/lib/turnstile";

describe("submitDisabled", () => {
  it("is off without a site key, whatever the token", () => {
    expect(submitDisabled({ busy: false, siteKey: "", token: null })).toBe(false);
  });
  it("waits for a token when a site key is set", () => {
    expect(submitDisabled({ busy: false, siteKey: "k", token: null })).toBe(true);
    expect(submitDisabled({ busy: false, siteKey: "k", token: "t" })).toBe(false);
  });
  it("is always disabled while busy", () => {
    expect(submitDisabled({ busy: true, siteKey: "", token: null })).toBe(true);
    expect(submitDisabled({ busy: true, siteKey: "k", token: "t" })).toBe(true);
  });
});
