// Anonymised from a real scan of our own AWS account. Identifiers are changed: the account is the AWS
// documentation placeholder and every resource is called example-*. Keep real values out of this file.

export type SampleFinding = {
  id: string;
  checkId: string;
  severity: "high" | "medium";
  status: "open" | "resolved";
  title: string;
  resource: string;
  explanation: string;
  fix: string;
};

export const SAMPLE_FINDINGS: SampleFinding[] = [
  {
    id: "sample-1",
    checkId: "iam-hygiene",
    severity: "high",
    status: "open",
    title: "An IAM user has administrator access",
    resource: "arn:aws:iam::123456789012:user/example-admin",
    explanation:
      "This user has the AdministratorAccess policy attached directly, so anyone holding its keys or password can do anything in the account. Found by reading the user's attached policies.",
    fix: "Move the permissions to a role that people assume with MFA, scoped to what they need, then detach the policy from the user.",
  },
  {
    id: "sample-2",
    checkId: "iam-hygiene",
    severity: "high",
    status: "resolved",
    title: "The root account has no MFA",
    resource: "arn:aws:iam::123456789012:root",
    explanation:
      "The root user can close the account and cannot be restricted by policy. Without MFA, a leaked password is enough. Found in the account's credential report. It was fixed the day after the first scan.",
    fix: "Turn on MFA for the root user, preferably with a hardware key, and keep the key somewhere safe.",
  },
  {
    id: "sample-3",
    checkId: "public-exposure",
    severity: "high",
    status: "open",
    title: "A storage bucket is public",
    resource: "example-templates-bucket",
    explanation:
      "Anyone on the internet can read this bucket. That is sometimes on purpose, such as files you publish for download. Found by reading the bucket's public-access settings and policy.",
    fix: "Confirm it holds nothing private. If it is meant to be public, say so by accepting the finding; if not, turn on public-access blocking.",
  },
  {
    id: "sample-4",
    checkId: "logging-and-detection",
    severity: "high",
    status: "open",
    title: "Threat detection is off in 16 regions",
    resource: "Threat detection, account 123456789012",
    explanation:
      "AWS's threat detection service is not switched on in 16 regions, so unusual activity there, such as a stolen key used abroad, would go unnoticed. Found by checking the service's status region by region.",
    fix: "Turn threat detection on in every region you could be attacked in, or block the regions you never use.",
  },
  {
    id: "sample-5",
    checkId: "backup-coverage",
    severity: "medium",
    status: "open",
    title: "A server is not in any backup plan",
    resource: "example-nat-instance",
    explanation:
      "No backup plan covers this server, so if it is lost nothing can bring it back. Found by comparing the account's backup plans with its running servers.",
    fix: "Add the server to a backup plan, or note why it can be rebuilt from code and accept the finding.",
  },
  {
    id: "sample-6",
    checkId: "backup-coverage",
    severity: "medium",
    status: "open",
    title: "A disk volume is not in any backup plan",
    resource: "example-data-volume",
    explanation:
      "No backup plan covers this disk. Found by comparing the account's backup plans with its attached disks.",
    fix: "Add the volume to a backup plan with a retention you can live with.",
  },
  {
    id: "sample-7",
    checkId: "backup-coverage",
    severity: "medium",
    status: "resolved",
    title: "A database is not in any backup plan",
    resource: "example-db",
    explanation:
      "No backup plan covered this database. Found by comparing the account's backup plans with its databases. It was added to a plan the same day.",
    fix: "Add the database to a backup plan.",
  },
];

export const SAMPLE_BRIEFING: { date: string; summary: string; lines: string[] } = {
  date: "20 November 2026",
  summary: "5 findings are open: 3 high and 2 medium. 2 were resolved since the first scan.",
  lines: [
    "High: an IAM user has administrator access.",
    "High: a storage bucket is public.",
    "High: threat detection is off in 16 regions.",
    "Resolved: the root account now has MFA.",
    "The connection is healthy and the last full scan finished overnight.",
  ],
};

export const SAMPLE_META = {
  generatedAt: "November 2026",
  note: "Anonymised from a real scan of our own AWS account. Identifiers changed.",
} as const;
