import { describe, expect, it } from "vitest";
import { consentWarnings, defaultOrg, LOOPBACK_WARNING, safeClientRedirect, signInUrl } from "@/lib/consent";

describe("consent", () => {
  it("renders_loopback_warning", () => {
    expect(consentWarnings({ verified: false, loopback: true })).toEqual(["Unverified client", LOOPBACK_WARNING]);
    expect(LOOPBACK_WARNING).toBe("Only approve if you started this on your own computer.");
    expect(consentWarnings({ verified: false, loopback: false })).toEqual(["Unverified client"]);
  });
  it("single_org_preselected", () => {
    expect(defaultOrg([{ slug: "a", name: "A" }])).toBe("a");
    expect(defaultOrg([{ slug: "a", name: "A" }, { slug: "b", name: "B" }])).toBe("");
  });
  it("returns to the consent request after sign-in", () => {
    expect(decodeURIComponent(signInUrl("r1").split("return_to=")[1] ?? "")).toBe("/oauth/consent?request_id=r1");
  });
  it("refuses script-bearing redirect schemes", () => {
    expect(safeClientRedirect("http://127.0.0.1:5000/cb?code=x")).toBe(true);
    expect(safeClientRedirect("cursor://anysphere.cursor-retrieval/oauth/callback")).toBe(true);
    expect(safeClientRedirect("javascript:alert(1)")).toBe(false);
    expect(safeClientRedirect("data:text/html,x")).toBe(false);
    expect(safeClientRedirect("not a url")).toBe(false);
  });
});
