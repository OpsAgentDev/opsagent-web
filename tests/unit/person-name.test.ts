import { describe, expect, it } from "vitest";
import { cleanName } from "@/lib/person-name";

describe("cleanName", () => {
  it("trims and keeps a normal name", () => expect(cleanName("  Ada Lovelace ")).toBe("Ada Lovelace"));
  it("rejects empty and blank", () => {
    expect(cleanName("")).toBeNull();
    expect(cleanName("   ")).toBeNull();
  });
  it("allows 80 characters, rejects 81", () => {
    expect(cleanName("a".repeat(80))).toBe("a".repeat(80));
    expect(cleanName("a".repeat(81))).toBeNull();
  });
  it("counts characters, not UTF-16 units", () => expect(cleanName("😀".repeat(80))).not.toBeNull());
  it("rejects control characters", () => {
    expect(cleanName("Ada\u0000")).toBeNull();
    expect(cleanName("Ada\nLovelace")).toBeNull();
  });
});
