import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { generateMetadata, generateStaticParams } from "@/app/(marketing)/problems/[slug]/page";
import { ProblemView } from "@/components/marketing/ProblemView";
import { PROBLEMS } from "@/lib/marketing/problems";

describe.each(PROBLEMS)("problem page $slug", (entry) => {
  const html = renderToStaticMarkup(createElement(ProblemView, { entry }));
  const sourced = [...entry.facts, entry.find, ...entry.steps];

  it("every AWS statement links to an AWS docs page", () => {
    for (const s of sourced) {
      expect(s.sourceUrl.startsWith("https://")).toBe(true);
      expect(new URL(s.sourceUrl).hostname).toBe("docs.aws.amazon.com");
      expect(html).toContain(`href="${s.sourceUrl}"`);
    }
  });

  it("is dated and shows the date", () => {
    expect(entry.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(html).toContain("2026");
  });

  it("promises no leak detection and no fixes", () => {
    expect(html).not.toMatch(/detects? (a )?leaked|auto-?remediat|SOC 2|compliant/i);
    expect(entry.cannot.join(" ")).toMatch(/read-only|never/);
  });

  it("metadata fits search limits", async () => {
    expect(entry.title.length).toBeLessThanOrEqual(60);
    expect(entry.description.length).toBeLessThanOrEqual(155);
    const meta = await generateMetadata({ params: Promise.resolve({ slug: entry.slug }) });
    expect(meta.title).toBe(entry.title);
  });

  it("is in the sitemap and llms.txt, and its tool link goes to a real page", () => {
    expect(sitemap().map((e) => e.url)).toContain(`https://opsagent.dev/problems/${entry.slug}`);
    expect(readFileSync("public/llms.txt", "utf8")).toContain(`https://opsagent.dev/problems/${entry.slug}`);
    if (entry.tool) expect(html).toContain(`href="${entry.tool.href}"`);
  });
});

describe("problem routes", () => {
  it("only known slugs exist and an unknown slug is a 404", async () => {
    expect(generateStaticParams()).toEqual(PROBLEMS.map((p) => ({ slug: p.slug })));
    await expect(generateMetadata({ params: Promise.resolve({ slug: "nope" }) })).rejects.toThrow();
  });

  it("finding wording matches the brain check thresholds quoted on the page", () => {
    const flags = PROBLEMS.flatMap((p) => p.flags).join(" ");
    for (const t of ["90 days", "7 days", "30 days", "under 7 days", "22, 3389, 3306, 5432"]) expect(flags).toContain(t);
  });
});
