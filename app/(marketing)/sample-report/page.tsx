import type { Metadata } from "next";
import Link from "next/link";
import { joinCta } from "@/lib/signups";
import { SAMPLE_BRIEFING, SAMPLE_FINDINGS, SAMPLE_META } from "@/lib/marketing/sample";
import "../landing.css";

export const metadata: Metadata = {
  title: "Sample cloud report: findings and briefing · OpsAgent",
  description:
    "See what OpsAgent reports: a morning briefing and findings with plain-English explanations and fixes, anonymised from a real scan of our own AWS account.",
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function SampleReport() {
  const cta = joinCta();
  return (
    <main className="page feature">
      <p className="feature-kicker">Sample report</p>
      <h1>What an OpsAgent report looks like</h1>
      <p className="lead">
        A real nightly scan, a morning briefing and the findings behind it. Each finding names the resource, says in
        plain English why it matters and what to do. OpsAgent only reads your cloud; it never applies a fix.
      </p>
      <p className="sample-note">{SAMPLE_META.note}</p>
      <section aria-labelledby="briefing-h" className="sample-briefing">
        <h2 id="briefing-h">Morning briefing, {SAMPLE_BRIEFING.date}</h2>
        <p>{SAMPLE_BRIEFING.summary}</p>
        <ul>
          {SAMPLE_BRIEFING.lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="findings-h">
        <h2 id="findings-h">Findings</h2>
        <ol className="check-cards sample-findings">
          {SAMPLE_FINDINGS.map((f) => (
            <li key={f.id}>
              <h3>{f.title}</h3>
              <p>{f.explanation}</p>
              <dl>
                <div><dt>Severity and status</dt><dd>{cap(f.severity)}, {f.status}</dd></div>
                <div><dt>Resource</dt><dd>{f.resource}</dd></div>
                <div><dt>What to do</dt><dd>{f.fix}</dd></div>
              </dl>
            </li>
          ))}
        </ol>
        <p>
          Report generated {SAMPLE_META.generatedAt}. See <Link href="/features/checks">what it checks</Link> and{" "}
          <Link href="/features/alerts">how alerts and briefings work</Link>.
        </p>
      </section>
      <section className="feature-cta" aria-labelledby="feature-cta-h">
        <h2 id="feature-cta-h">Get your own report.</h2>
        <p>Start a 14-day free trial. Card required, cancel any time.</p>
        <Link href={cta.href} className="trial-cta">{cta.label}</Link>
      </section>
    </main>
  );
}
