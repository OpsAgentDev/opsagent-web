import { describe, expect, it } from "vitest";
import { consentOf, gaCookies, gaId } from "@/lib/analytics";

describe("analytics consent", () => {
  it("is only an answer we stored: anything else asks again", () => {
    expect(consentOf("granted")).toBe("granted");
    expect(consentOf("denied")).toBe("denied");
    for (const v of [null, "", "yes", "GRANTED"]) expect(consentOf(v)).toBeNull();
  });
  it("is off unless the build value is a Measurement ID", () => {
    expect(gaId("G-ABC123XYZ9")).toBe("G-ABC123XYZ9");
    for (const v of [undefined, "", "UA-1234-5", "G-abc", "G-ABC123</script>", "G-ABC 123"]) expect(gaId(v)).toBe("");
  });
  it("finds Google Analytics' cookies and nothing else", () => {
    expect(gaCookies("opsagent_session=x; _ga=GA1.1.1; _ga_ABC123=GS1.1; _gat=1; theme=dark")).toEqual(["_ga", "_ga_ABC123"]);
    expect(gaCookies("")).toEqual([]);
  });
});
