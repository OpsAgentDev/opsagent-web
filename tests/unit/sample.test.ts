import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SampleReport from "@/app/(marketing)/sample-report/page";
import sitemap from "@/app/sitemap";
import { SAMPLE_BRIEFING, SAMPLE_FINDINGS, SAMPLE_META } from "@/lib/marketing/sample";

const PLACEHOLDER = "123456789012";
const html = renderToStaticMarkup(createElement(SampleReport));
const sources = { data: JSON.stringify({ SAMPLE_FINDINGS, SAMPLE_BRIEFING, SAMPLE_META }), html };

describe("sample report", () => {
  it.each(Object.entries(sources))("sample_has_no_identifiers: %s", (_name, text) => {
    const twelveDigits = (text.match(/(?<!\d)\d{12}(?!\d)/g) ?? []).filter((n) => n !== PLACEHOLDER);
    expect(twelveDigits).toEqual([]);
    expect(text).not.toMatch(/\bi-[0-9a-f]{8,}/);
    expect(text).not.toMatch(/\bvol-[0-9a-f]{8,}/);
    expect(text).not.toMatch(/opsagent-/i);
    expect(text).not.toMatch(/binary/i);
    // Every ARN must carry the placeholder account.
    for (const arn of text.match(/arn:aws[^\s"'<,]*/g) ?? []) expect(arn).toContain(`::${PLACEHOLDER}:`);
  });

  it("sample_ids_unique", () => {
    const ids = SAMPLE_FINDINGS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(6);
    expect(ids.length).toBeLessThanOrEqual(8);
  });

  it("states the data is anonymised, above the findings", () => {
    expect(SAMPLE_META.note).toBe("Anonymised from a real scan of our own AWS account. Identifiers changed.");
    expect(html.indexOf(SAMPLE_META.note)).toBeGreaterThan(-1);
    expect(html.indexOf(SAMPLE_META.note)).toBeLessThan(html.indexOf("Findings</h2>"));
  });

  it("never claims OpsAgent applies a fix", () => {
    for (const f of SAMPLE_FINDINGS) expect(f.fix).not.toMatch(/opsagent|we (will|can)/i);
  });

  it("briefing summary matches the findings", () => {
    const open = SAMPLE_FINDINGS.filter((f) => f.status === "open");
    const count = (s: string) => open.filter((f) => f.severity === s).length;
    expect(SAMPLE_BRIEFING.summary).toContain(`${open.length} findings are open: ${count("high")} high and ${count("medium")} medium`);
    expect(SAMPLE_BRIEFING.summary).toContain(`${SAMPLE_FINDINGS.length - open.length} were resolved`);
  });

  it("marketing_routes_indexed", () => {
    expect(sitemap().map((e) => e.url)).toContain("https://opsagent.dev/sample-report");
    expect(readFileSync("public/llms.txt", "utf8")).toContain("https://opsagent.dev/sample-report");
    expect(readFileSync("components/marketing/SiteFooter.tsx", "utf8")).toContain('"/sample-report"');
  });
});
