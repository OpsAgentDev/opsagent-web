"use client";

import Link from "next/link";
import { useState } from "react";
import { joinCta } from "@/lib/signups";
import { analyseCredentialReport } from "@/lib/tools/credential-report";
import { credentialExample, SG_EXAMPLE, TRUST_EXAMPLE } from "@/lib/tools/examples";
import { analyseSecurityGroups } from "@/lib/tools/sg-exposure";
import { analyseTrustPolicy } from "@/lib/tools/trust-policy";
import type { ToolResult } from "@/lib/tools/types";

// Everything runs in the page: no fetch, nothing is uploaded.
const TOOLS = {
  sg: {
    analyse: (t: string) => analyseSecurityGroups(t),
    example: () => SG_EXAMPLE,
    noun: "security group",
    label: "Paste the JSON here",
    urgent: "Fixing these is the easy part. Keeping them fixed is the job.",
    urgentBody: "OpsAgent checks every security group in every region it can read, every 15 minutes, and tells you in Slack when a database or SSH port opens to the world. It is read-only: the role it uses cannot change your account, and you create it yourself from a template you can read first.",
    calm: "Nothing urgent in what you pasted. Security groups are one of ten checks.",
    more: "See the other nine",
  },
  iam: {
    analyse: (t: string) => analyseCredentialReport(t),
    example: () => credentialExample(),
    noun: "user",
    label: "Paste the CSV here",
    urgent: "This is a snapshot. Keys age every day.",
    urgentBody: "OpsAgent runs this check every night, with AdministratorAccess on users and the other nine checks, and tells you only when something changed. It is read-only, and you can read the role template before you create it.",
    calm: "Nothing overdue in what you pasted. IAM is one of ten checks.",
    more: "See the other nine",
  },
  trust: {
    analyse: (t: string) => analyseTrustPolicy(t),
    example: () => TRUST_EXAMPLE,
    noun: "role",
    label: "Paste the JSON here",
    urgent: "A trust policy is checked once, here. Nobody watches it after.",
    urgentBody: "OpsAgent does not read role trust policies yet. Every night it does check your IAM users and keys, public exposure, backups and certificates, read-only, and tells you only when something changed.",
    calm: "Nothing found in what you pasted. OpsAgent does not read trust policies yet, but it checks other things every night.",
    more: "See what OpsAgent checks",
  },
} as const;

export function PasteTool({ tool }: { tool: keyof typeof TOOLS }) {
  const t = TOOLS[tool];
  const [text, setText] = useState("");
  const [result, setResult] = useState<ToolResult | null>(null);
  const cta = joinCta();
  // Never let an odd paste escape as an uncaught error.
  const run = (input: string) => {
    try { setResult(t.analyse(input)); } catch { setResult({ ok: false, error: "That could not be read. Check that you pasted the whole output." }); }
  };
  const serious = result?.ok && result.findings.some((f) => f.severity === "critical" || f.severity === "high" || f.severity === "medium");

  return (
    <section className="tool" aria-labelledby="tool-h">
      <h2 id="tool-h">{t.label}</h2>
      <textarea
        className="tool-input"
        aria-labelledby="tool-h"
        spellCheck={false}
        rows={12}
        value={text}
        onChange={(e) => { setText(e.target.value); setResult(null); }}
      />
      <div className="tool-actions">
        <button type="button" className="trial-cta" onClick={() => run(text)}>Check</button>
        <button type="button" className="copy-btn" onClick={() => { const ex = t.example(); setText(ex); run(ex); }}>Try an example</button>
      </div>
      <div role="status" aria-live="polite">
        {result && !result.ok && <p className="tool-error">{result.error}</p>}
        {result?.ok && (
          <p>
            Checked {result.checked} {t.noun}{result.checked === 1 ? "" : "s"}.{" "}
            {result.findings.length === 0 ? "Nothing found." : `${result.findings.length} to look at.`}
          </p>
        )}
      </div>
      {result?.ok && (
        <div className="tool-results">
          <ol className="check-cards">
            {result.findings.map((f, i) => (
              <li key={i}>
                <h3><span className={`sev sev-${f.severity}`}>{f.severity}</span> {f.title}</h3>
                <p>{f.detail}</p>
              </li>
            ))}
          </ol>
          <aside className="tool-cta">
            <h2>{serious ? t.urgent : t.calm}</h2>
            {serious ? <p>{t.urgentBody}</p> : <p><Link href="/features/checks">{t.more}</Link>.</p>}
            <Link href={cta.href} className="trial-cta">{cta.label}</Link>{" "}
            <Link href="/security">What the role can and cannot read</Link>
          </aside>
        </div>
      )}
    </section>
  );
}
