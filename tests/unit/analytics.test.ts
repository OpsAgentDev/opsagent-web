import { describe, expect, it } from "vitest";
import { consentOf, gaCookies } from "@/lib/analytics";

describe("analytics consent", () => {
  it("is only an answer we stored: anything else asks again", () => {
    expect(consentOf("granted")).toBe("granted");
    expect(consentOf("denied")).toBe("denied");
    for (const v of [null, "", "yes", "GRANTED"]) expect(consentOf(v)).toBeNull();
  });
  it("finds Google Analytics' cookies and nothing else", () => {
    expect(gaCookies("opsagent_session=x; _ga=GA1.1.1; _ga_ABC123=GS1.1; _gat=1; theme=dark")).toEqual(["_ga", "_ga_ABC123"]);
    expect(gaCookies("")).toEqual([]);
  });
});
