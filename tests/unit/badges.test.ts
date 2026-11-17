import { describe, expect, it } from "vitest";
import { classToken } from "@/components/badges";

describe("classToken", () => {
  it("keeps enum values and drops anything that could add a class", () => {
    expect(classToken("critical")).toBe("critical");
    expect(classToken("revoked_at_period_end")).toBe("revoked_at_period_end");
    expect(classToken("open hidden x")).toBe("openhiddenx");
    expect(classToken('a" onclick="b')).toBe("aonclickb");
  });
});
