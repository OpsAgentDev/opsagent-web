import type { Metadata } from "next";
import Link from "next/link";
import { FeaturePage, FeatureSection } from "@/components/marketing/FeaturePage";
import * as I from "@/components/marketing/landing-icons";
import { PLANS } from "@/lib/plans";
import "../../landing.css";

export const metadata: Metadata = {
  title: "AWS DevOps Agent alternative for small teams · OpsAgent",
  description:
    "OpsAgent vs AWS DevOps Agent: nightly read-only checks for a flat monthly price, or incident investigations billed per agent-second. Sourced, checked 23 November 2026.",
};

// Every AWS claim below comes from the pages in SOURCES, read on CHECKED. Re-check them before changing a row.
const CHECKED = "23 November 2026";
const PRICING = "https://aws.amazon.com/devops-agent/pricing/";
const FAQ = "https://aws.amazon.com/devops-agent/faqs/";
const PRODUCT = "https://aws.amazon.com/devops-agent/";
const SOURCES: [string, string][] = [
  ["AWS DevOps Agent pricing", PRICING],
  ["AWS DevOps Agent FAQs", FAQ],
  ["AWS DevOps Agent product page", PRODUCT],
];
const starter = PLANS.find((p) => p.id === "starter")!.price;

const ROWS: [string, string, string][] = [
  ["Main job", "Investigates incidents and finds the root cause, with mitigation steps. Also release readiness reviews (preview).", "Checks your cloud every night for exposure, IAM, backups, certificates, logging and cost, and tells you what to fix."],
  ["When it works", "When an incident is investigated, when you chat with it, or on a cadence you set with custom agents.", "A full scan every night, plus urgent exposures checked every 15 minutes."],
  ["Price", "US$0.0083 per agent-second, about US$30 per hour of agent time. Two-month free trial; credits for some AWS Support plans.", `Flat, per connected cloud account: from ${starter} a month, whatever it finds.`],
  ["Changes to your cloud", "Its pages describe mitigation steps and specs handed to a coding agent; they do not say it changes resources itself.", "None. It connects read-only and never changes anything."],
  ["Clouds", "AWS, with Azure and on-prem through integrations and MCP servers.", "AWS today; the product is built to be provider-neutral."],
  ["Security and cost checks", "Not described on its pages; AWS lists security reviews under a separate Security Agent.", "Ten deterministic checks, including public exposure, IAM hygiene, idle resources and cost anomalies."],
  ["Use from Claude or Cursor", "Connects to MCP servers as tools.", "Is an MCP server: your agent reads findings and evidence."],
];

export default function CompareAwsDevOpsAgent() {
  return (
    <FeaturePage
      slug="compare-aws-devops-agent"
      kicker="Compare"
      title="OpsAgent and AWS DevOps Agent"
      lead="They do different jobs. AWS DevOps Agent investigates incidents when something breaks and bills by the second. OpsAgent looks for problems every night, before they break anything, for one flat price. Some teams will want both."
    >
      <div className="compare-wrap">
        <table className="compare-table">
          <caption className="sr-only">OpsAgent and AWS DevOps Agent side by side</caption>
          <thead>
            <tr><th scope="col"></th><th scope="col">AWS DevOps Agent</th><th scope="col">OpsAgent</th></tr>
          </thead>
          <tbody>
            {ROWS.map(([label, aws, ours]) => (
              <tr key={label}><th scope="row">{label}</th><td>{aws}</td><td>{ours}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <FeatureSection Icon={I.BellIcon} title="When AWS DevOps Agent fits">
        <p>
          You run on AWS, you have incidents to investigate, and you want an agent that reads your telemetry and
          proposes the root cause. If your AWS Support plan earns DevOps Agent credits, much of that time may already
          be paid for.
        </p>
      </FeatureSection>
      <FeatureSection Icon={I.SunIcon} title="When OpsAgent fits">
        <p>
          You have no SRE, and you want someone to look over the account every night: a public snapshot, an old access
          key, a backup that stopped, a certificate about to expire, an idle resource still billing. One calm morning
          briefing, urgent exposures in Slack, and a price that does not grow with use. See{" "}
          <Link href="/features/checks">what it checks</Link>.
        </p>
      </FeatureSection>
      <FeatureSection Icon={I.CostIcon} title="Price, worked out">
        <p>
          At US$0.0083 an agent-second, an hour of AWS DevOps Agent time is about US$30, so {starter} buys a little over
          three hours. OpsAgent Starter is {starter} a month per cloud account, however many nights it scans. Prices
          are in US dollars; see <Link href="/pricing">pricing</Link>.
        </p>
      </FeatureSection>
      <section aria-labelledby="sources-h" className="compare-sources">
        <h2 id="sources-h">Sources</h2>
        <p>AWS details were read from AWS&apos;s own pages on {CHECKED}. Prices and features change; check them before you decide.</p>
        <ul>
          {SOURCES.map(([label, href]) => (
            <li key={href}><a href={href} rel="noopener noreferrer" target="_blank">{label}</a></li>
          ))}
        </ul>
      </section>
    </FeaturePage>
  );
}
