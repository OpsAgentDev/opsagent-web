import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "@/lib/api/client";
import { isSameOrigin } from "@/lib/safe-redirect";

describe("resolveApiBaseUrl", () => {
  it("uses the configured URL", () => expect(resolveApiBaseUrl("https://b.example", "production")).toBe("https://b.example"));
  it("defaults to localhost outside production", () => expect(resolveApiBaseUrl(undefined, "development")).toBe("http://localhost:3000"));
  it("throws in production when unset or empty", () => {
    expect(() => resolveApiBaseUrl(undefined, "production")).toThrow(/NEXT_PUBLIC_API_BASE_URL/);
    expect(() => resolveApiBaseUrl("", "production")).toThrow();
  });
});

describe("isSameOrigin", () => {
  const origin = "https://opsagent.dev";
  it("accepts paths and same-origin URLs", () => {
    expect(isSameOrigin("/dashboard", origin)).toBe(true);
    expect(isSameOrigin("https://opsagent.dev/x", origin)).toBe(true);
  });
  it("rejects other origins and protocol-relative forms", () => {
    for (const t of ["https://evil.test/", "//evil.test", "/\\evil.test", "javascript:alert(1)", "http://opsagent.dev/"]) {
      expect(isSameOrigin(t, origin)).toBe(false);
    }
  });
});
