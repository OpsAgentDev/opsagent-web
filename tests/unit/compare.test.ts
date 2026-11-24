import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { generateMetadata, generateStaticParams } from "@/app/(marketing)/compare/[slug]/page";
import Pricing from "@/app/(marketing)/pricing/page";
import sitemap from "@/app/sitemap";
import { CompareView } from "@/components/marketing/CompareView";
import { COMPARE, type CompareEntry } from "@/lib/marketing/compare";
import { PLANS } from "@/lib/plans";

const pricingHtml = renderToStaticMarkup(createElement(Pricing));
const htmlOf = (e: CompareEntry) => renderToStaticMarkup(createElement(CompareView, { entry: e }));
const allText = JSON.stringify(COMPARE) + COMPARE.map(htmlOf).join("");
const entryOf = (slug: string) => COMPARE.find((c) => c.slug === slug)!;
const row = (e: CompareEntry, l: string) => e.rows.find((r) => r.label === l)!;

// Official pages only: each entry's sources must be on its own vendor's domains.
const HOSTS: Record<string, RegExp> = {
  "aws-devops-agent": /(^|\.)amazon\.com$/,
  cleric: /^(docs\.)?cleric\.ai$/,
  "trusted-advisor-security-hub": /(^|\.)amazon\.com$/,
};

describe("compare entries", () => {
  it("covers the three planned entries with unique slugs", () => {
    expect(COMPARE.map((c) => c.slug).sort()).toEqual(Object.keys(HOSTS).sort());
  });
});

describe.each(COMPARE)("compare page $slug", (entry) => {
  const html = htmlOf(entry);

  it("every_row_has_source", () => {
    expect(entry.rows.length).toBeGreaterThanOrEqual(6);
    for (const r of entry.rows) {
      expect(r.sourceUrl.startsWith("https://")).toBe(true);
      expect(new URL(r.sourceUrl).hostname).toMatch(HOSTS[entry.slug]!);
      expect(html).toContain(`href="${r.sourceUrl}"`);
    }
  });

  it("is dated: asOf is an ISO date and the page shows it", () => {
    expect(entry.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(html).toContain("As of 24 November 2026");
    expect(entry.asOf).toBe("2026-11-24");
  });

  it("prices_match_pricing_page", () => {
    const price = row(entry, "Price");
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

  it("is_fair: an honest not-do list and one row where the other option fits better", () => {
    expect(entry.notDo.length).toBeGreaterThanOrEqual(3);
    for (const phrase of [/never changes|applies no fix|read-only/i, /AWS only|only AWS/i]) {
      expect(entry.notDo.join(" ")).toMatch(phrase);
    }
    for (const n of entry.notDo) expect(html).toContain(n.replace(/&/g, "&amp;"));
    expect(entry.rows.filter((r) => /fits better/i.test(r.label))).toHaveLength(1);
  });

  it("makes no promise beyond the PRD, no superlatives, no logos, no email", () => {
    expect(allText).not.toMatch(/\b(best(?! practices?\b)|fastest|cheapest|leading|#1|unmatched|better than|worse than)\b/i);
    expect(entry.rows.map((r) => r.opsagent).join(" ")).not.toMatch(/auto-?fix|auto-?remediat|applies? (fixes|changes) for you/i);
    expect(html).not.toMatch(/<img|<svg[^>]*logo/i);
    // The shared waitlist form's input placeholder is the only address-shaped text allowed.
    expect(allText.replaceAll("you@company.com", "")).not.toMatch(/[\w.]+@[\w.]+\.\w+/);
  });

  it("states the OpsAgent side as the product is today", () => {
    expect(row(entry, "Use from AI agents").opsagent).toContain("With an owner's approval, an agent can also triage findings and connect accounts. No tool changes your cloud.");
    expect(row(entry, "Use from AI agents").opsagent).not.toMatch(/read-only MCP/i);
    expect(row(entry, "Price").opsagent).toContain("AI credit top-ups are optional.");
    expect(row(entry, "Changes to your cloud").opsagent).toMatch(/^None\./);
    expect(entry.rows[0]!.opsagent).toContain("ten deterministic checks");
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

describe("sourced facts that were checked on 2026-11-24", () => {
  it("AWS DevOps Agent: the fact-check corrections stay", () => {
    expect(row(entryOf("aws-devops-agent"), "Price").them).toContain("Connected AWS services, such as CloudWatch Logs Insights queries, bill separately.");
  });

  it("Cleric: list prices, credit rates and the write-access wording match its pages", () => {
    const e = entryOf("cleric");
    const price = row(e, "Price");
    for (const t of ["Team $700", "Pro $1,500", "Scale $3,000", "$0.50", "1,400", "3,000", "6,000", "1,000 evaluation credits"]) expect(price.them).toContain(t);
    expect(price.sourceUrl).toBe("https://cleric.ai/pricing");
    const writes = row(e, "Changes to your cloud").them;
    expect(writes).toMatch(/read-only/);
    expect(writes).toMatch(/pull requests/);
    expect(writes).toMatch(/cannot merge/);
    expect(row(e, "Use from AI agents").them).toContain("MCP");
    expect(row(e, "How it starts").them).toContain("a scheduled monitor (Pro and above)");
    expect(price.them).toContain("new work pauses until the next credit release, unless you buy more credits or turn on overage.");
  });

  it("Trusted Advisor: says exactly which plan unlocks which checks", () => {
    const e = entryOf("trusted-advisor-security-hub");
    const free = row(e, "Trusted Advisor checks on Basic or Developer Support").them;
    for (const t of ["Basic Support", "Developer Support", "Service limits", "EBS public snapshots", "RDS public snapshots", "S3 bucket permissions", "MFA on the root account", "security groups with specific ports unrestricted", "STS global endpoint usage"]) {
      expect(free).toContain(t);
    }
    const full = row(e, "Trusted Advisor checks with Business Support+, Enterprise Support or Unified Operations").them;
    expect(full).toContain("Business Support+, Enterprise Support or Unified Operations");
    expect(full).toContain("$29");
    expect(full).toContain("refresh");
    expect(full).toContain("January 1, 2027");
    expect(e.description).toContain("which checks AWS Support plans unlock");
    expect(full).not.toMatch(/paid plan/i);
    expect(e.rows.find((r) => r.label.startsWith("Trusted Advisor checks with"))!.opsagent).toContain("AWS bills about a cent per scan for the Cost Explorer and CloudWatch reads.");
  });

  it("Security Hub: names the standards and the pricing model AWS publishes", () => {
    const e = entryOf("trusted-advisor-security-hub");
    for (const t of ["CIS", "PCI DSS", "NIST"]) expect(row(e, "What Security Hub does").them).toContain(t);
    expect(row(e, "Price").them).toContain("for one Region in US East (N. Virginia), use $3.75 per resource unit");
    expect(row(e, "Price").them).toContain("30-day free trial");
    expect(row(e, "Security Hub CSPM price").them).toContain("per security check");
    expect(row(e, "Security Hub CSPM price").them).toContain("AWS Config configuration items are priced separately; Config rules that Security Hub CSPM turns on are not charged.");
  });
});
