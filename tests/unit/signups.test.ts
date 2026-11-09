import { describe, expect, it } from "vitest";
import { closingLine, joinCta } from "@/lib/signups";

describe("signups switch", () => {
  it("keeps the waitlist while closed", () => {
    expect(joinCta(false)).toEqual({ label: "Join the waitlist", href: "/#waitlist" });
    expect(closingLine(false)).toMatch(/waitlist/);
  });
  it("sends everyone to the free trial once open, with no alpha wording", () => {
    expect(joinCta(true)).toEqual({ label: "Start free trial", href: "/sign-up" });
    expect(closingLine(true)).not.toMatch(/alpha|waitlist/i);
  });
});
