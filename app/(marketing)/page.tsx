import Link from "next/link";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { BriefingCard } from "@/components/marketing/BriefingCard";
import { MCP_URL } from "@/lib/agents";

const STEPS = [
  {
    title: "Connect read-only",
    body: "Create a role in one click. It can read how your cloud is set up and what it costs, and it physically cannot read your data.",
  },
  {
    title: "Nightly checks",
    body: "Every night, deterministic checks run against your account. Fixed rules decide what is wrong, with no AI guessing.",
  },
  {
    title: "Morning briefing",
    body: "In Slack, exceptions only, and skipped when nothing changed, plus a weekly report. Every finding cites its evidence.",
  },
];

const CHECKS = [
  ["Idle resources and cost anomalies", "Things you pay for that nobody uses, and spend that jumps for no clear reason."],
  ["IAM hygiene", "Old access keys, users without MFA, and admin access nobody needs."],
  ["Public exposure", "Storage, databases and open ports that anyone on the internet can reach."],
  ["Backup coverage", "Which resources have backups, and whether the permissions to restore them are in place."],
  ["Certificate expiry", "Certificates close to expiring, flagged before your users see the error."],
  ["Logging and detection gaps", "Audit logs and threat detection that are switched off or incomplete."],
  ["Idle GPUs and stuck training jobs", "GPU machines doing nothing, and training jobs that stopped making progress."],
  ["Leaked secrets that are still active", "Secrets flagged by GitHub secret scanning whose keys are still active in your cloud."],
  ["Infrastructure-as-code drift", "Resources that no longer match the code that is supposed to define them."],
  ["Deploy and pipeline health", "Pipelines that keep failing and deploys that stalled halfway."],
];

const NEVER = [
  ["Write to your infrastructure", "Its role has no write permissions, so it cannot change, stop or delete anything."],
  ["Read your data", "It never reads objects, rows or secrets; only configuration, metadata and billing."],
  ["Page you at 3am", "There is no on-call and no night alert. Findings wait for your morning briefing."],
  ["Resell AI", "You bring your own agent or model key, and pay your AI provider directly."],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-text">
          <h1>Your cloud, checked every night.</h1>
          <p className="lead">
            A read-only agent for teams with no ops person. Every morning you get a short briefing of what&apos;s wrong
            and why. It never changes anything.
          </p>
          <WaitlistForm source="landing-hero" />
          <p className="hero-who">
            Built for the founding engineer who owns the cloud bill, and for the developer who inherited the
            infrastructure when the contractor left.
          </p>
        </div>
        <BriefingCard />
      </section>

      <section className="section" id="how-it-works" aria-labelledby="how-it-works-h">
        <h2 id="how-it-works-h">How it works</h2>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section split" id="what-it-checks" aria-labelledby="what-it-checks-h">
        <div>
          <h2 id="what-it-checks-h">What it checks</h2>
          <p className="section-lead">
            Ten checks run every night. Each finding names the resource and shows the
            evidence, so you can confirm it yourself.
          </p>
        </div>
        <ul className="checks">
          {CHECKS.map(([title, body]) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section never" id="never" aria-labelledby="never-h">
        <h2 id="never-h">What it will never do</h2>
        <ul>
          {NEVER.map(([title, body]) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section split" id="bring-your-own-ai" aria-labelledby="byo-h">
        <div>
          <h2 id="byo-h">Bring your own AI</h2>
          <p className="section-lead">OpsAgent never pays for or resells inference.</p>
        </div>
        <div className="byo">
          <p>
            Point Claude, Cursor or any other MCP client at OpsAgent and ask about your findings in plain words. Or add
            your own model key for explanations and chat.
          </p>
          <p className="mcp-url">
            <span>MCP server</span>
            <code>{MCP_URL}</code>
          </p>
          <p>
            <Link href="/docs/connect-your-agent">Connect your agent</Link>
          </p>
        </div>
      </section>

      <section className="section closing" aria-labelledby="closing-h">
        <h2 id="closing-h">Start your mornings knowing what changed.</h2>
        <p className="section-lead">
          The alpha opens to a few teams at a time. Join the waitlist and we will email you when your spot is ready.
        </p>
        <WaitlistForm source="landing-footer" />
      </section>
    </main>
  );
}
