import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { generateMetadata, generateStaticParams } from "@/app/(marketing)/compare/[slug]/page";
import Pricing from "@/app/(marketing)/pricing/page";
import sitemap from "@/app/sitemap";
import { CompareView } from "@/components/marketing/CompareView";
import { COMPARE } from "@/lib/marketing/compare";
import { PLANS } from "@/lib/plans";

const entry = COMPARE.find((c) => c.slug === "aws-devops-agent")!;
const html = renderToStaticMarkup(createElement(CompareView, { entry }));
const pricingHtml = renderToStaticMarkup(createElement(Pricing));
const allText = JSON.stringify(COMPARE) + html;

describe("compare pages", () => {
  it("every_row_has_source", () => {
    expect(entry.rows.length).toBeGreaterThanOrEqual(6);
    for (const r of entry.rows) {
      expect(r.sourceUrl.startsWith("https://")).toBe(true);
      expect(new URL(r.sourceUrl).hostname).toMatch(/(^|\.)amazon\.com$|(^|\.)aws\.amazon\.com$/); // official AWS pages only
      expect(html).toContain(`href="${r.sourceUrl}"`);
    }
  });

  it("is dated: asOf is an ISO date and the page shows it", () => {
    expect(entry.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(html).toContain("As of 24 November 2026");
    expect(entry.asOf).toBe("2026-11-24");
  });

  it("prices_match_pricing_page", () => {
    const price = entry.rows.find((r) => r.label === "Price")!;
    for (const p of PLANS) {
      expect(price.opsagent).toContain(`${p.name} US${p.price}`);
      expect(pricingHtml).toContain(p.price);
    }
    expect(pricingHtml).toContain("per cloud account per month");
    expect(price.opsagent).toContain("per cloud account");
  });

  it("marketing_routes_indexed", () => {
    const urls = sitemap().map((e) => e.url);
    const llms = readFileSync("public/llms.txt", "utf8");
    for (const c of COMPARE) {
      expect(urls).toContain(`https://opsagent.dev/compare/${c.slug}`);
      expect(llms).toContain(`https://opsagent.dev/compare/${c.slug}`);
    }
    expect(generateStaticParams()).toEqual(COMPARE.map((c) => ({ slug: c.slug })));
  });

  it("is_fair: an honest not-do list and one row where AWS DevOps Agent fits better", () => {
    expect(entry.notDo.length).toBeGreaterThanOrEqual(3);
    for (const phrase of [/never changes|applies no fix|read-only/i, /AWS only|only AWS/i]) {
      expect(entry.notDo.join(" ")).toMatch(phrase);
    }
    for (const n of entry.notDo) expect(html).toContain(n.replace(/&/g, "&amp;"));
    expect(entry.rows.some((r) => /AWS DevOps Agent fits better/i.test(r.label))).toBe(true);
  });

  it("makes no promise beyond the PRD, no superlatives, no logos, no email", () => {
    expect(allText).not.toMatch(/\b(best|fastest|cheapest|leading|#1|unmatched|better than|worse than)\b/i);
    expect(entry.rows.map((r) => r.opsagent).join(" ")).not.toMatch(/auto-?fix|auto-?remediat|applies? (fixes|changes) for you/i);
    expect(html).not.toMatch(/<img|<svg[^>]*logo/i);
    // The shared waitlist form's input placeholder is the only address-shaped text allowed.
    expect(allText.replace("you@company.com", "")).not.toMatch(/[\w.]+@[\w.]+\.\w+/);
  });

  it("keeps the facts the fact check corrected", () => {
    const row = (l: string) => entry.rows.find((r) => r.label === l)!;
    expect(row("Use from AI agents").opsagent).toContain("With an owner's approval, an agent can also triage findings and connect accounts. No tool changes your cloud.");
    expect(row("Use from AI agents").opsagent).not.toMatch(/read-only MCP/i);
    expect(row("Price").them).toContain("Connected AWS services, such as CloudWatch Logs Insights queries, bill separately.");
    expect(row("Price").opsagent).toContain("AI credit top-ups are optional.");
  });

  it("carries Product JSON-LD with the live prices", () => {
    const m = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
    expect(m).not.toBeNull();
    const ld = JSON.parse((m?.[1] ?? "").replace(/&quot;/g, '"'));
    expect(ld["@type"]).toBe("Product");
    expect(ld.name).toBe("OpsAgent");
    expect(ld.offers.map((o: { price: string }) => `$${o.price}`)).toEqual(PLANS.map((p) => p.price));
    expect(ld.offers.every((o: { priceCurrency: string }) => o.priceCurrency === "USD")).toBe(true);
  });

  it("metadata fits search limits and the unknown slug is a 404", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: entry.slug }) });
    expect(String(meta?.title).length).toBeLessThanOrEqual(60);
    expect(String(meta?.description).length).toBeLessThanOrEqual(155);
    await expect(generateMetadata({ params: Promise.resolve({ slug: "nope" }) })).rejects.toThrow();
  });
});
