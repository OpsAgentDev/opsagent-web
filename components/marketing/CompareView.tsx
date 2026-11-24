import { FeaturePage, FeatureSection } from "@/components/marketing/FeaturePage";
import * as I from "@/components/marketing/landing-icons";
import type { CompareEntry } from "@/lib/marketing/compare";
import { PLANS, PRICE_NOTE } from "@/lib/plans";

/** "2026-11-24" to "24 November 2026". */
export const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "OpsAgent",
  description: "A read-only ops agent for AWS: nightly checks, a morning briefing and an MCP server, for a flat price per cloud account.",
  url: "https://opsagent.dev",
  offers: PLANS.map((p) => ({
    "@type": "Offer",
    name: p.name,
    price: p.price.replace("$", ""),
    priceCurrency: "USD",
    url: "https://opsagent.dev/pricing",
  })),
};

/** One comparison page, rendered from its data entry. */
export function CompareView({ entry }: { entry: CompareEntry }) {
  const sources = [...new Set(entry.rows.map((r) => r.sourceUrl))];
  return (
    <FeaturePage slug={`compare-${entry.slug}`} kicker="Compare" title={`OpsAgent and ${entry.name}`} lead={entry.description}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <p className="compare-asof">As of {longDate(entry.asOf)}. Every {entry.name} row links to the page it comes from.</p>
      <div className="compare-wrap">
        <table className="compare-table">
          <caption className="sr-only">OpsAgent and {entry.name} side by side</caption>
          <thead>
            <tr><th scope="col"></th><th scope="col">{entry.name}</th><th scope="col">OpsAgent</th></tr>
          </thead>
          <tbody>
            {entry.rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                <td>
                  {r.them} <a href={r.sourceUrl} rel="noopener noreferrer" target="_blank" aria-label={`Source for ${r.label}`}>Source</a>
                </td>
                <td>{r.opsagent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="compare-note">{PRICE_NOTE}</p>
      <FeatureSection Icon={I.NoWriteIcon} title="What OpsAgent does not do">
        <ul>
          {entry.notDo.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </FeatureSection>
      <section aria-labelledby="sources-h" className="compare-sources">
        <h2 id="sources-h">Sources</h2>
        <p>
          {entry.name} details were read from its own pages on {longDate(entry.asOf)}. Prices and features change; check
          them before you decide.
        </p>
        <ul>
          {sources.map((href) => (
            <li key={href}><a href={href} rel="noopener noreferrer" target="_blank">{href}</a></li>
          ))}
        </ul>
      </section>
    </FeaturePage>
  );
}
