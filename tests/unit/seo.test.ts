import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("seo", () => {
  it("sitemap lists https pages only", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://opsagent.dev/pricing");
    expect(urls.every((u) => new URL(u).origin === "https://opsagent.dev")).toBe(true);
  });
  it("robots allows all and points to the sitemap", () => {
    expect(robots().sitemap).toBe("https://opsagent.dev/sitemap.xml");
    expect(robots().rules).toMatchObject({ allow: "/" });
  });
});
