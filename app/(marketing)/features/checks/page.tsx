import type { Metadata } from "next";
import { FeaturePage } from "@/components/marketing/FeaturePage";
import * as I from "@/components/marketing/landing-icons";

export const metadata: Metadata = {
  title: "What it checks · OpsAgent",
  description: "Ten deterministic, read-only checks across cost, security, backups, certificates, logging, encryption, hardening and GPUs. Every finding cites its evidence.",
};

const NIGHTLY = "Nightly";

const CHECKS: { title: string; Icon: typeof I.CostIcon; looks: string; evidence: string; runs: string }[] = [
  {
    title: "Idle resources and cost anomalies",
    Icon: I.CostIcon,
    looks: "Unattached volumes, unused addresses, idle load balancers, machines under 5% CPU for a week, stopped machines still paying for storage, old snapshots, and days when spend jumps above its 7 and 30-day baselines.",
    evidence: "Billing data, the resource and its usage metrics, with dollar amounts.",
    runs: NIGHTLY,
  },
  {
    title: "IAM hygiene",
    Icon: I.UserKeyIcon,
    looks: "Access keys older than 90 days, console users without MFA, admin policies attached to users, and root account use in the last 30 days.",
    evidence: "The credential report, users, access keys and MFA status.",
    runs: NIGHTLY,
  },
  {
    title: "Public exposure",
    Icon: I.GlobeIcon,
    looks: "Public database snapshots, databases anyone can reach, storage without public-access blocking, and admin or database ports open to the whole internet.",
    evidence: "Public-access settings and the firewall rules that allow the traffic.",
    runs: "Every 15 minutes for snapshots, databases and open ports; everything nightly",
  },
  {
    title: "Backup coverage",
    Icon: I.BackupIcon,
    looks: "Resources no backup plan covers, backup jobs that failed, one-day retention, and whether the permissions to restore are actually in place.",
    evidence: "Backup plans and jobs, database retention, and a simulation of the restore permissions.",
    runs: NIGHTLY,
  },
  {
    title: "Certificate expiry",
    Icon: I.CertIcon,
    looks: "Certificates close to expiring, managed renewals that failed, certificates attached to nothing, and endpoints serving a different certificate.",
    evidence: "The certificate list, days to expiry and the endpoints that use them.",
    runs: NIGHTLY,
  },
  {
    title: "Logging and detection gaps",
    Icon: I.LogIcon,
    looks: "Audit logging that is off or not writing, threat detection switched off in a region, and log groups with no retention limit, with their estimated cost.",
    evidence: "Audit trail status, threat detection per region and log retention settings.",
    runs: "Every 15 minutes for the audit trail; everything nightly",
  },
  {
    title: "Idle GPUs and stuck training jobs",
    Icon: I.GpuIcon,
    looks: "GPU machines under 5% use for a day, and training jobs running far longer than usual or over 24 hours.",
    evidence: "GPU machines, their 24-hour use, and training job history.",
    runs: NIGHTLY,
  },
  {
    title: "Encryption at rest",
    Icon: I.ShieldIcon,
    looks: "Database storage that is not encrypted, unencrypted disks (more urgent when attached), and unencrypted snapshots you own. Encryption cannot be switched on in place, so each finding says how to move to an encrypted copy.",
    evidence: "The encryption flag on each database, disk and snapshot.",
    runs: NIGHTLY,
  },
  {
    title: "Instance hardening",
    Icon: I.CloudIcon,
    looks: "Servers that still accept the older instance metadata service (IMDSv1), which makes credential theft easier. More urgent when the server has a public address.",
    evidence: "Each instance's metadata settings and whether it has a public address.",
    runs: NIGHTLY,
  },
  {
    title: "Credential depth",
    Icon: I.KeyIcon,
    looks: "Access keys that were created and never used, users holding two active keys, and console passwords unused for 90 days.",
    evidence: "The credential report: key creation and last-use dates and password activity.",
    runs: NIGHTLY,
  },
];

const FACTS: [string, string, typeof I.CostIcon][] = [
  ["Deterministic", "Fixed rules decide what is wrong. No AI guessing, and no model calls.", I.CheckIcon],
  ["Read-only", "Checks only read from your cloud. They never change, stop or delete anything.", I.ShieldIcon],
  ["Evidence on every finding", "Each finding names the resource, the check and the evidence, so you can confirm it.", I.FlagIcon],
];

export default function Checks() {
  return (
    <FeaturePage
      slug="checks"
      title="What it checks"
      lead="Ten checks run against your cloud every night, and the most urgent ones every 15 minutes. Each one says what it found and shows you why."
    >
      <ul className="feature-facts">
        {FACTS.map(([title, body, Icon]) => (
          <li key={title}>
            <span className="ico"><Icon /></span>
            <h2>{title}</h2>
            <p>{body}</p>
          </li>
        ))}
      </ul>
      <section aria-labelledby="checks-h">
        <h2 id="checks-h">The ten checks</h2>
        <ol className="check-cards">
          {CHECKS.map((c) => (
            <li key={c.title}>
              <span className="ico"><c.Icon /></span>
              <h3>{c.title}</h3>
              <p>{c.looks}</p>
              <dl>
                <div><dt>Evidence</dt><dd>{c.evidence}</dd></div>
                <div><dt>Runs</dt><dd>{c.runs}</dd></div>
              </dl>
            </li>
          ))}
        </ol>
        <p>Leaked-secret follow-up, infrastructure-as-code drift and deploy health come after launch.</p>
      </section>
    </FeaturePage>
  );
}
