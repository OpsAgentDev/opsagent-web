import Link from "next/link";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { BriefingCard } from "@/components/marketing/BriefingCard";
import { AlertCard } from "@/components/marketing/AlertCard";
import { ComingSoon } from "@/components/marketing/ComingSoon";
import { MCP_URL } from "@/lib/agents";

const DAY_NIGHT = [
  { title: "While you sleep", body: "Checks keep running.", soon: true },
  { title: "When it's urgent", body: "An alert in Slack or the app.", soon: true },
  { title: "Every morning", body: "One short briefing, skipped when nothing changed.", soon: false },
];

const STEPS = [
  {
    title: "Connect read-only",
    body: "Create a role in one click. It can read how your cloud is set up and what it costs, and it cannot read your stored data or change anything, except what you opt into (see Security).",
  },
  {
    title: "Checks run",
    body: "Deterministic checks run against your account. Fixed rules decide what is wrong, with no AI guessing. Every night today.",
    soon: "Around the clock:",
  },
  {
    title: "Briefing and alerts",
    body: "A morning briefing in Slack, exceptions only and skipped when nothing changed, plus a weekly report.",
    soon: "Urgent alerts:",
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
  ["Read your data", "It cannot read your stored data (objects, database rows, secret values); it reads configuration, metadata and billing, plus a few scoped reads you opt into, listed on the Security page."],
  ["Spam you with noise", "Only urgent findings will ever interrupt you, and only on the channels you choose. Everything else waits for your morning briefing."],
  ["Resell AI", "You bring your own agent or model key, and pay your AI provider directly."],
];

export default function Home() {
  return (
    <main>
      <section className="hero" id="waitlist">
        <div className="hero-text">
          <h1>Your ops teammate that never sleeps.</h1>
          <p className="lead">
            OpsAgent watches your cloud day and night, read-only. Urgent problems reach you the moment they matter.
            Everything else waits for a calm morning briefing. It never changes anything.
          </p>
          <p className="hero-note">
            Around-the-clock checks and instant alerts are coming soon; nightly checks and the morning briefing are what
            alpha users get today.
          </p>
          <WaitlistForm source="landing-hero" />
          <p className="hero-who">
            Built for the founding engineer who owns the cloud bill, and for the developer who inherited the
            infrastructure when the contractor left.
          </p>
        </div>
        <div className="hero-cards">
          <AlertCard />
          <BriefingCard />
        </div>
      </section>

      <section className="section" aria-labelledby="day-night-h">
        <h2 id="day-night-h">While you sleep, and when you wake</h2>
        <ul className="daynight">
          {DAY_NIGHT.map((d) => (
            <li key={d.title}>
              <h3>{d.title}</h3>
              <p>{d.body}</p>
              {d.soon && <ComingSoon />}
            </li>
          ))}
        </ul>
      </section>

      <section className="section" id="how-it-works" aria-labelledby="how-it-works-h">
        <h2 id="how-it-works-h">How it works</h2>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              {s.soon && (
                <p className="step-soon">
                  {s.soon} <ComingSoon />
                </p>
              )}
            </li>
          ))}
        </ol>
        <p className="section-more">
          <Link href="/how-it-works">See how it works</Link>
        </p>
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

      <section className="section mobile-strip" aria-labelledby="mobile-h">
        <h2 id="mobile-h">OpsAgent for iOS and Android: alerts and briefings in your pocket.</h2>
        <ComingSoon />
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
        <h2 id="closing-h">Get your ops teammate.</h2>
        <p className="section-lead">
          The alpha opens to a few teams at a time. Join the waitlist and we will email you when your spot is ready.
        </p>
        <WaitlistForm source="landing-footer" />
      </section>
    </main>
  );
}
