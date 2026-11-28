// Competitor claims on /compare/<slug>. Rule: a row exists only if its `them` text is stated on the page at
// `sourceUrl` (an official page of the competitor) as of `asOf`. Re-check every row monthly; drop any you cannot
// confirm. The OpsAgent column comes from the PRD and `docs/tech-spec/mvp-marketing.md`, never from the source.

export type CompareRow = { label: string; opsagent: string; them: string; sourceUrl: string };

export type CompareEntry = {
  slug: string;
  name: string;
  /** Page title and search-result title. */
  title: string;
  /** The h1, when "OpsAgent and <name>" does not read well. */
  heading?: string;
  /** Meta description, and the lead paragraph under the heading. */
  description: string;
  /** ISO date the rows were last checked against their sources. */
  asOf: string;
  rows: CompareRow[];
  /** What OpsAgent does not do, in its own words. */
  notDo: string[];
};

// The OpsAgent column, from the PRD and `docs/tech-spec/mvp-marketing.md`. Shared so every page says the same thing.
const WHAT_IT_DOES =
  "Runs ten deterministic checks on your AWS account every night and tells you what to fix. Urgent exposures are checked every 15 minutes. Each finding cites its resource, evidence and check; Dashboard AI explains it in plain language once an owner turns it on.";
const PRICE =
  "Flat per cloud account per month: Starter US$99, Team US$299, Scale US$599, plus tax where applicable. It does not change with how much the agent finds. AI credit top-ups are optional.";
const AI_AGENTS =
  "An MCP server: Claude, Cursor or any MCP client reads findings and evidence. With an owner's approval, an agent can also triage findings and connect accounts. No tool changes your cloud.";
const SIGN_UP = "Sign up on the web, then connect an AWS account with a read-only role.";
const AWS_ONLY = "AWS only for now. The product is built to be provider-neutral.";
const NO_CHANGES = "None. OpsAgent connects read-only and never applies a fix.";
const NOT_DO_BASE = [
  "It never changes your cloud: no fixes, no remediation and no write access in this version.",
  "It covers AWS only for now.",
];

const DOCS = "https://docs.aws.amazon.com/devopsagent/latest/userguide";
const ABOUT = `${DOCS}/about-aws-devops-agent.html`;
const ACTIONS = `${DOCS}/working-with-devops-agent-working-with-directed-actions.html`;
const FAQS = "https://aws.amazon.com/devops-agent/faqs/";
const PRICING = "https://aws.amazon.com/devops-agent/pricing/";

const CLERIC_HOME = "https://cleric.ai/";
const CLERIC_PRICING = "https://cleric.ai/pricing";
const CLERIC_DOCS = "https://docs.cleric.ai/";
const CLERIC_FAQ = "https://docs.cleric.ai/reference/faq";
const CLERIC_INTEGRATIONS = "https://docs.cleric.ai/integrations/supported-integrations";

const SUPPORT_DOCS = "https://docs.aws.amazon.com/awssupport/latest/user";
const TA = `${SUPPORT_DOCS}/trusted-advisor.html`;
const TA_REF = `${SUPPORT_DOCS}/trusted-advisor-check-reference.html`;
const SH_DOC = "https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html";
const SH_PRICING = "https://aws.amazon.com/security-hub/pricing/";
const SH_CSPM_PRICING = "https://aws.amazon.com/security-hub/cspm/pricing/";

const PROWLER_HOME = "https://prowler.com/";
const PROWLER_PRICING = "https://prowler.com/pricing";
const PROWLER_DOCS = "https://docs.prowler.com";
const PROWLER_AUTH = `${PROWLER_DOCS}/user-guide/providers/aws/authentication.md`;
const PROWLER_FIXER = `${PROWLER_DOCS}/user-guide/cli/tutorials/fixer.md`;
const PROWLER_SCHEDULE = `${PROWLER_DOCS}/user-guide/tutorials/prowler-scan-scheduling.md`;
const PROWLER_MCP = `${PROWLER_DOCS}/getting-started/products/prowler-mcp.md`;

export const COMPARE: CompareEntry[] = [
  {
    slug: "aws-devops-agent",
    name: "AWS DevOps Agent",
    title: "AWS DevOps Agent alternative for small teams · OpsAgent",
    description:
      "AWS DevOps Agent investigates incidents and bills per agent-second. OpsAgent checks your AWS account read-only every night for a flat monthly price.",
    asOf: "2026-11-24",
    rows: [
      {
        label: "What it does",
        them: "Starts investigating when an alert or support ticket arrives, correlates telemetry, code and deployment data to find the root cause, proposes mitigation steps, and recommends changes to stop repeat incidents.",
        opsagent: WHAT_IT_DOES,
        sourceUrl: ABOUT,
      },
      {
        label: "Who it is for",
        them: "AWS describes an always-available teammate that spans software change and operations across AWS, multicloud and on-prem environments. Administrators set it up; on-call engineers or SREs work with it in its web app.",
        opsagent: "Small engineering teams on AWS with no dedicated ops or SRE person. The buyer is the CTO or lead developer.",
        sourceUrl: FAQS,
      },
      {
        label: "How you get it",
        them: "You need an AWS account. An administrator sets it up in the AWS Management Console by creating an Agent Space that defines what the agent can reach.",
        opsagent: SIGN_UP,
        sourceUrl: FAQS,
      },
      {
        label: "Price",
        them: "Pay as you go at US$0.0083 per agent-second, billed for investigations, evaluations and on-demand tasks, with no upfront commitment. AWS lists a free trial and monthly credits for some AWS Support plans. Connected AWS services, such as CloudWatch Logs Insights queries, bill separately. See AWS's pricing page for the current terms.",
        opsagent: PRICE,
        sourceUrl: PRICING,
      },
      {
        label: "Clouds",
        them: "AWS. Azure resources connect through Microsoft Entra ID, and on-premises systems through observability integrations or private MCP servers.",
        opsagent: AWS_ONLY,
        sourceUrl: FAQS,
      },
      {
        label: "Changes to your cloud",
        them: "Read-only actions by default. Directed actions that create or modify resources are off until you opt in, need an operator's approval for each action, and exclude deleting resources.",
        opsagent: NO_CHANGES,
        sourceUrl: ACTIONS,
      },
      {
        label: "Security reviews",
        them: "AWS calls DevOps Agent and AWS Security Agent different but complementary: Security Agent covers threat modeling, penetration testing and security reviews.",
        opsagent: "Checks your running account for exposure, IAM hygiene, backups, certificates, logging and cost.",
        sourceUrl: FAQS,
      },
      {
        label: "Use from AI agents",
        them: "Can be reached over MCP, ACP and A2A, and connects to private or remote MCP servers.",
        opsagent: AI_AGENTS,
        sourceUrl: ABOUT,
      },
      {
        label: "Where AWS DevOps Agent fits better",
        them: "When something is broken now. It works across tools such as CloudWatch, Datadog, GitHub, PagerDuty and Slack to investigate the incident and propose mitigation steps.",
        opsagent: "OpsAgent does not investigate live incidents or read your logs and traces to find a root cause.",
        sourceUrl: ABOUT,
      },
    ],
    notDo: [
      ...NOT_DO_BASE,
      "It does not investigate incidents as they happen or find a root cause from your logs and traces.",
      "It does not page you, run on-call schedules or store logs and metrics.",
      "It does not review code changes before release.",
    ],
  },
  {
    slug: "cleric",
    name: "Cleric",
    title: "Cleric alternative for small teams · OpsAgent",
    description:
      "Cleric investigates alerts and checks releases, priced in credits. OpsAgent checks your AWS account read-only every night for a flat monthly price.",
    asOf: "2026-11-24",
    rows: [
      {
        label: "What it does",
        them: "An AI SRE that investigates production issues. When an alert fires or you ask, it queries logs, metrics and system state to find root causes and recommend solutions.",
        opsagent: WHAT_IT_DOES,
        sourceUrl: CLERIC_DOCS,
      },
      {
        label: "How it starts",
        them: "An Issue starts from an alert, a scheduled monitor (Pro and above) or a failed deploy. For up to 14 days after a change deploys, it also watches for regressions. You can chat with it in Slack, Microsoft Teams or its web app.",
        opsagent: "On a schedule: a full scan every night, and urgent exposures every 15 minutes. It needs no alert or deploy to start.",
        sourceUrl: CLERIC_PRICING,
      },
      {
        label: "Clouds and tools",
        them: "Connects to your existing tools. Its docs list AWS, Google Cloud, Kubernetes, Datadog, Grafana, Prometheus, PagerDuty, GitHub and others. For AWS you create an IAM role from a trust policy Cleric gives you, and Cleric assumes it with temporary credentials.",
        opsagent: AWS_ONLY,
        sourceUrl: CLERIC_INTEGRATIONS,
      },
      {
        label: "How you get it",
        them: "You add integrations yourself in its web app, or have a coding agent add them over MCP. Slack is its primary way to interact with Cleric; Microsoft Teams is also supported.",
        opsagent: SIGN_UP,
        sourceUrl: CLERIC_INTEGRATIONS,
      },
      {
        label: "Price",
        them: "Credits cost $0.50 each. Plans per month, with annual billing also offered: Team $700 for 1,400 credits, Pro $1,500 for 3,000 credits, Scale $3,000 for 6,000 credits. Enterprise is custom and billed annually. Verifying one production change costs 2 credits ($1) and investigating one Issue costs 10 credits ($5). Users are unlimited. A trial gives 1,000 evaluation credits after approval, with no time limit. When credits run out, new work pauses until the next credit release, unless you buy more credits or turn on overage.",
        opsagent: PRICE,
        sourceUrl: CLERIC_PRICING,
      },
      {
        label: "Changes to your cloud",
        them: "It primarily investigates using read-only access. Its GitHub integration has write permissions by default, so it can create branches, open pull requests and file issues. Cleric says it is instructed that it cannot merge pull requests, and recommends branch protection on your default branch.",
        opsagent: NO_CHANGES,
        sourceUrl: CLERIC_FAQ,
      },
      {
        label: "Use from AI agents",
        them: "You can use Cleric from Claude Code, Cursor and other MCP clients to search its knowledge or start an investigation. It can also connect to your MCP servers to use their tools and data. MCP access is on every plan.",
        opsagent: AI_AGENTS,
        sourceUrl: CLERIC_PRICING,
      },
      {
        label: "Where Cleric fits better",
        them: "When something is broken, or a release may have broken it. It brings the cause, the evidence and a fix pull request to review, then checks that the issue is resolved after the fix deploys.",
        opsagent: "OpsAgent does not investigate live incidents, read your logs and traces to find a root cause, open pull requests or watch releases.",
        sourceUrl: CLERIC_HOME,
      },
    ],
    notDo: [
      ...NOT_DO_BASE,
      "It does not investigate incidents as they happen or find a root cause from your logs and traces.",
      "It does not open pull requests or watch your releases for regressions.",
      "It does not page you, run on-call schedules or store logs and metrics.",
      "It does not review code changes before release.",
    ],
  },
  {
    slug: "trusted-advisor-security-hub",
    name: "AWS Trusted Advisor and Security Hub",
    title: "Trusted Advisor and Security Hub, or OpsAgent",
    heading: "OpsAgent, or doing it yourself with AWS Trusted Advisor and Security Hub",
    description:
      "Doing it yourself with AWS Trusted Advisor and Security Hub: which checks AWS Support plans unlock, how each is priced, and where OpsAgent differs.",
    asOf: "2026-11-24",
    rows: [
      {
        label: "What Trusted Advisor does",
        them: "Inspects your AWS environment and recommends ways to save money, improve availability and performance, or help close security gaps.",
        opsagent: WHAT_IT_DOES,
        sourceUrl: TA,
      },
      {
        label: "What Security Hub does",
        them: "Security Hub CSPM runs checks against security standards, including AWS Foundational Security Best Practices, CIS, PCI DSS and NIST, and generates control findings. It also receives findings from services such as GuardDuty, Inspector and Macie, so you see them in one place.",
        opsagent: "OpsAgent runs its own ten checks. It does not score your account against CIS, PCI DSS or NIST, and it does not take in other tools' findings.",
        sourceUrl: SH_DOC,
      },
      {
        label: "Trusted Advisor checks on Basic or Developer Support",
        them: "With Basic Support or Developer Support, the console shows all Service limits checks and six more: Amazon EBS public snapshots, Amazon RDS public snapshots, Amazon S3 bucket permissions, MFA on the root account, security groups with specific ports unrestricted, and AWS STS global endpoint usage.",
        opsagent: "Ten checks run nightly on each connected account. They cover public snapshots and buckets, open admin and database ports, root MFA, access keys, backups, certificates, logging, encryption, instance hardening, idle resources and GPUs.",
        sourceUrl: TA_REF,
      },
      {
        label: "Trusted Advisor checks with Business Support+, Enterprise Support or Unified Operations",
        them: "The full set of Trusted Advisor checks, and its API, come with Business Support+, Enterprise Support or Unified Operations. Basic Support has no automatic check updates: you refresh Security checks by hand. AWS lists Business Support+, which adds 24/7 access to AWS experts, at a $29 a month minimum per account. AWS says Developer Support and Business Support will be discontinued on January 1, 2027.",
        opsagent: "OpsAgent does not depend on your AWS Support plan. The flat price below covers all ten checks. AWS bills about a cent per scan for the Cost Explorer and CloudWatch reads.",
        sourceUrl: TA,
      },
      {
        label: "How you get it",
        them: "You enable Security Hub CSPM in each AWS Region you want covered: it only processes findings in the Region where you enabled it, and full CIS AWS Foundations Benchmark coverage needs every supported Region. Most control findings also need AWS Config switched on and recording resources.",
        opsagent: SIGN_UP,
        sourceUrl: SH_DOC,
      },
      {
        label: "Price",
        them: "Security Hub Essentials plan: billed per resource unit per month, pro-rated for the time resources are monitored. One EC2 instance is one unit, 12 Lambda functions are one unit, 18 container images are one unit and 125 IAM users or roles are one unit. AWS's pricing examples, for one Region in US East (N. Virginia), use $3.75 per resource unit. The plan includes Security Hub CSPM and the AWS Config service-linked recorder. There is a 30-day free trial.",
        opsagent: PRICE,
        sourceUrl: SH_PRICING,
      },
      {
        label: "Security Hub CSPM price",
        them: "Security Hub CSPM on its own is priced on security checks, finding ingestion events and automation rule evaluations. Its examples price the first 100,000 checks a month at $0.0010 per security check. Findings from its own security checks are not charged for ingestion. AWS Config configuration items are priced separately; Config rules that Security Hub CSPM turns on are not charged. There is a 30-day free trial.",
        opsagent: "Flat per cloud account, whatever the number of findings.",
        sourceUrl: SH_CSPM_PRICING,
      },
      {
        label: "Changes to your cloud",
        them: "Automation rules modify or suppress findings. Through Amazon EventBridge you can define custom actions, such as sending findings to a ticketing system or to an automated remediation system.",
        opsagent: NO_CHANGES,
        sourceUrl: SH_DOC,
      },
      {
        label: "Use from AI agents",
        them: "Security Hub CSPM has a console, an API, the AWS CLI and SDKs.",
        opsagent: AI_AGENTS,
        sourceUrl: SH_DOC,
      },
      {
        label: "Where doing it yourself fits better",
        them: "When you need to assess your account against a named standard such as CIS, PCI DSS or NIST, or bring findings from other AWS security services and partner products into one view across accounts.",
        opsagent: "OpsAgent does not assess against those standards or take in other tools' findings. It lists each AWS account separately.",
        sourceUrl: SH_DOC,
      },
    ],
    notDo: [
      ...NOT_DO_BASE,
      "It does not assess your account against CIS, PCI DSS or NIST.",
      "It does not take in findings from other security tools.",
      "It does not roll findings up across accounts; each AWS account is listed separately.",
    ],
  },  {
    slug: "prowler",
    name: "Prowler",
    title: "Prowler alternative for small teams · OpsAgent",
    description:
      "Prowler is open source and covers many clouds and compliance frameworks. OpsAgent is a hosted, read-only nightly AWS check with a next step per finding.",
    asOf: "2026-11-28",
    rows: [
      {
        label: "What it does",
        them: "Describes itself as the world's most widely used open-source cloud security platform. Its homepage claims 2,500+ open checks across 34 providers, mapped to 100+ compliance frameworks.",
        opsagent: WHAT_IT_DOES,
        sourceUrl: PROWLER_HOME,
      },
      {
        label: "How you get it",
        them: "Open Source, Prowler Cloud and Private Cloud run the same engine. Open Source is free under Apache-2.0 and you run it yourself on a laptop, in CI/CD, on Kubernetes or on a local server. Prowler Cloud is hosted by Prowler, with auto-scaling scans.",
        opsagent: SIGN_UP,
        sourceUrl: PROWLER_PRICING,
      },
      {
        label: "Price",
        them: "Prowler Cloud costs $99 per cloud account per month, or $79 billed annually, with 50,000 resources included, pooled across your tenant. A cloud account is an AWS account, Google Cloud project, Azure subscription, GitHub repository or Microsoft 365 tenant. The free trial runs 7 days with no credit card.",
        opsagent: PRICE,
        sourceUrl: PROWLER_PRICING,
      },
      {
        label: "Clouds",
        them: "Its docs list official support for AWS, Azure, Google Cloud, Alibaba Cloud, Cloudflare, OpenStack and Oracle Cloud. Its homepage counts 34 providers, including AI and SaaS services.",
        opsagent: AWS_ONLY,
        sourceUrl: PROWLER_DOCS,
      },
      {
        label: "AWS access",
        them: "Attach the AWS managed policies SecurityAudit and ViewOnlyAccess to the user or role. For certain checks, additional read-only permissions are required.",
        opsagent: "A read-only role that allows only the AWS actions its checks call. No write access.",
        sourceUrl: PROWLER_AUTH,
      },
      {
        label: "Changes to your cloud",
        them: "Cloud scans use read-only access. Prowler Realtime applies fixes only when you enable automatic remediation and configure a dedicated role. The Autonomous Fixer opens a pull request, on paid plans.",
        opsagent: NO_CHANGES,
        sourceUrl: PROWLER_HOME,
      },
      {
        label: "Fixing findings from the command line",
        them: "The open-source CLI can fix some of the failed findings it identifies, when you run it with a fixer option. Its example applies s3:PutAccountPublicAccessBlock.",
        opsagent: "OpsAgent gives the console path and CLI command as the next step. You run it, or not.",
        sourceUrl: PROWLER_FIXER,
      },
      {
        label: "Standards",
        them: "Maps results to compliance frameworks, naming CIS, SOC 2, ISO 27001, PCI DSS and NIS2.",
        opsagent: "Does not assess your account against named standards.",
        sourceUrl: PROWLER_HOME,
      },
      {
        label: "How often it scans",
        them: "In Prowler Cloud with a subscription, you schedule scans daily, every 48 hours, weekly or monthly. The scan time is on the hour.",
        opsagent: "A full scan every night at a time you choose, and urgent exposures every 15 minutes.",
        sourceUrl: PROWLER_SCHEDULE,
      },
      {
        label: "Use from AI agents",
        them: "A Cloud MCP server at mcp.prowler.com connects Claude, Cursor or any MCP client to Prowler Cloud. Its docs say the server is under active development.",
        opsagent: AI_AGENTS,
        sourceUrl: PROWLER_MCP,
      },
      {
        label: "Where Prowler fits better",
        them: "When you need more than AWS, a free self-hosted scanner, or results against compliance frameworks such as CIS, SOC 2 or PCI DSS. It also offers fixers.",
        opsagent: "OpsAgent is AWS only, hosted only and read-only. It does not assess against those frameworks or apply fixes.",
        sourceUrl: PROWLER_HOME,
      },
    ],
    notDo: [
      ...NOT_DO_BASE,
      "It does not assess your account against CIS, SOC 2, ISO 27001 or PCI DSS.",
      "It cannot be self-hosted; it is a hosted service.",
    ],
  },
];
