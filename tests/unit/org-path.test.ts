import { describe, expect, it } from "vitest";
import { orgHref, splitOrgPath } from "@/lib/org-path";

describe("organisation addresses", () => {
  it("splits the prefix off and puts it back", () => {
    expect(splitOrgPath("/o/acme/findings/1")).toEqual({ slug: "acme", path: "/findings/1" });
    expect(splitOrgPath("/o/acme")).toEqual({ slug: "acme", path: "/dashboard" });
    expect(splitOrgPath("/findings")).toEqual({ slug: null, path: "/findings" });
    expect(splitOrgPath("/oauth/consent")).toEqual({ slug: null, path: "/oauth/consent" });
    expect(orgHref("acme", "/settings/billing")).toBe("/o/acme/settings/billing");
  });

  it("treats a malformed escape in the slug as no organisation instead of throwing", () => {
    expect(splitOrgPath("/o/%E0%A4%A/dashboard")).toEqual({ slug: null, path: "/dashboard" });
  });
});
