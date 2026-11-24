// Competitor claims on /compare/<slug>. Rule: a row exists only if its `them` text is stated on the page at
// `sourceUrl` (an official page of the competitor) as of `asOf`. Re-check every row monthly; drop any you cannot
// confirm. The OpsAgent column comes from the PRD and `docs/tech-spec/mvp-marketing.md`, never from the source.

export type CompareRow = { label: string; opsagent: string; them: string; sourceUrl: string };

export type CompareEntry = {
  slug: string;
  name: string;
  /** Page title and search-result title. */
  title: string;
  /** Meta description, and the lead paragraph under the heading. */
  description: string;
  /** ISO date the rows were last checked against their sources. */
  asOf: string;
  rows: CompareRow[];
  /** What OpsAgent does not do, in its own words. */
  notDo: string[];
};

const DOCS = "https://docs.aws.amazon.com/devopsagent/latest/userguide";
const ABOUT = `${DOCS}/about-aws-devops-agent.html`;
const ACTIONS = `${DOCS}/working-with-devops-agent-working-with-directed-actions.html`;
const FAQS = "https://aws.amazon.com/devops-agent/faqs/";
const PRICING = "https://aws.amazon.com/devops-agent/pricing/";

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
        opsagent:
          "Runs ten deterministic checks on your AWS account every night and tells you what to fix. Urgent exposures are checked every 15 minutes. Each finding cites its resource, evidence and check; Dashboard AI explains it in plain language once an owner turns it on.",
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
        opsagent: "Sign up on the web, then connect an AWS account with a read-only role.",
        sourceUrl: FAQS,
      },
      {
        label: "Price",
        them: "Pay as you go at US$0.0083 per agent-second, billed for investigations, evaluations and on-demand tasks, with no upfront commitment. AWS lists a free trial and monthly credits for some AWS Support plans. See AWS's pricing page for the current terms.",
        opsagent:
          "Flat per cloud account per month: Starter US$99, Team US$299, Scale US$599, plus tax where applicable. It does not change with how much the agent finds.",
        sourceUrl: PRICING,
      },
      {
        label: "Clouds",
        them: "AWS. Azure resources connect through Microsoft Entra ID, and on-premises systems through observability integrations or private MCP servers.",
        opsagent: "AWS only for now. The product is built to be provider-neutral.",
        sourceUrl: FAQS,
      },
      {
        label: "Changes to your cloud",
        them: "Read-only actions by default. Directed actions that create or modify resources are off until you opt in, need an operator's approval for each action, and exclude deleting resources.",
        opsagent: "None. OpsAgent connects read-only and never applies a fix.",
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
        opsagent: "Is a read-only MCP server: Claude, Cursor or any MCP client reads findings and evidence.",
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
      "It never changes your cloud: no fixes, no remediation and no write access in this version.",
      "It covers AWS only for now.",
      "It does not investigate incidents as they happen or find a root cause from your logs and traces.",
      "It does not page you, run on-call schedules or store logs and metrics.",
      "It does not review code changes before release.",
    ],
  },
];
