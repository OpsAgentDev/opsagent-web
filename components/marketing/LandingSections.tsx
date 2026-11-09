import Link from "next/link";
import { Reveal } from "@/components/marketing/Reveal";
import * as I from "@/components/marketing/landing-icons";

/** The landing page's middle sections; each reveals as it scrolls in (see landing.css). */

const at = (i: number) => ({ "--i": i }) as React.CSSProperties;

const STEPS = [
  {
    Icon: I.KeyIcon,
    title: "Connect read-only",
    body: "Create a role in one click. It can read how your cloud is set up and what it costs, and it cannot read your stored data or change anything, except what you opt into (see Security). Today that means AWS.",
  },
  {
    Icon: I.CheckIcon,
    title: "Checks run",
    body: "Deterministic checks run against your account. Fixed rules decide what is wrong, with no AI guessing.",
  },
  {
    Icon: I.BellIcon,
    title: "Briefing and alerts",
    body: "A morning briefing in Slack, exceptions only and skipped when nothing changed, plus a weekly report. Urgent exposures reach you within minutes.",
  },
];

const CHECKS: [string, string, typeof I.CostIcon][] = [
  ["Idle resources and cost anomalies", "Things you pay for that nobody uses, and spend that jumps for no clear reason.", I.CostIcon],
  ["IAM hygiene", "Old access keys, users without MFA, and admin access nobody needs.", I.UserKeyIcon],
  ["Public exposure", "Storage, databases and open ports that anyone on the internet can reach.", I.GlobeIcon],
  ["Backup coverage", "Which resources have backups, and whether the permissions to restore them are in place.", I.BackupIcon],
  ["Certificate expiry", "Certificates close to expiring, flagged before your users see the error.", I.CertIcon],
  ["Logging and detection gaps", "Audit logs and threat detection that are switched off or incomplete.", I.LogIcon],
  ["Idle GPUs and stuck training jobs", "GPU machines doing nothing, and training jobs that stopped making progress.", I.GpuIcon],
  ["Encryption at rest", "Database storage, disks and snapshots that are not encrypted.", I.SecretIcon],
  ["Instance hardening", "Servers that still accept the older metadata service (IMDSv1).", I.ShieldIcon],
  ["Credential depth", "Access keys never used, users with two active keys, and stale console passwords.", I.KeyIcon],
];

const NEVER: [string, string, typeof I.CostIcon][] = [
  ["Write to your infrastructure", "Its role has no write permissions, so it cannot change, stop or delete anything.", I.NoWriteIcon],
  ["Read your data", "It cannot read your stored data (objects, database rows, secret values); it reads configuration, metadata and billing, plus a few scoped reads you opt into, listed on the Security page.", I.NoEyeIcon],
  ["Spam you with noise", "Only urgent findings will ever interrupt you, and only on the channels you choose. Everything else waits for your morning briefing.", I.NoBellIcon],
  ["Send your data to AI without asking", "Dashboard AI stays off until an owner turns it on, and MCP traffic never touches OpsAgent's model key.", I.NoUploadIcon],
];

export function HowItWorks() {
  return (
    <section className="section" id="how-it-works" aria-labelledby="how-it-works-h">
      <h2 id="how-it-works-h">How it works</h2>
      <Reveal as="ol" className="steps">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rv" style={at(4 + i * 5)}>
            <span className="step-badge"><s.Icon size={22} /></span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </li>
        ))}
      </Reveal>
      <p className="section-more">
        <Link href="/how-it-works">See how it works</Link>
      </p>
    </section>
  );
}

export function Checks() {
  return (
    <section className="section split" id="what-it-checks" aria-labelledby="what-it-checks-h">
      <div>
        <h2 id="what-it-checks-h">What it checks</h2>
        <p className="section-lead">
          Ten checks run every night. Each finding names the resource and shows the
          evidence, so you can confirm it yourself.
        </p>
      </div>
      <Reveal as="ul" className="checks">
        {CHECKS.map(([title, body, Icon], i) => (
          <li key={title} className="rv" style={at(i)}>
            <span className="ico"><Icon /></span>
            <h3>{title}</h3>
            <p>{body}</p>
          </li>
        ))}
      </Reveal>
    </section>
  );
}

export function Never() {
  return (
    <section className="section never" id="never" aria-labelledby="never-h">
      <h2 id="never-h">What it will never do</h2>
      <Reveal as="ul">
        {NEVER.map(([title, body, Icon]) => (
          <li key={title} className="rv">
            <span className="ico ico-bad"><Icon /></span>
            <h3>{title}</h3>
            <p>{body}</p>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
