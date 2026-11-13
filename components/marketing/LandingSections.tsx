import Link from "next/link";
import { ComingSoon } from "@/components/marketing/ComingSoon";
import { AccessLedger, AgentSession, FindingsPanel, SlackAlert, SlackBriefing } from "@/components/marketing/LandingVisuals";
import { Live } from "@/components/marketing/Live";
import { MCP_URL } from "@/lib/agents";

/** The home page's sections below the hero, in story order. One idea each; the visuals are in LandingVisuals. */

const CHECKS = [
  "Idle resources and cost anomalies",
  "IAM hygiene",
  "Public exposure",
  "Backup coverage",
  "Certificate expiry",
  "Logging and detection gaps",
  "Idle GPUs and stuck training jobs",
  "Encryption at rest",
  "Instance hardening",
  "Credential depth",
];

export function Checks() {
  return (
    <section className="lp-sec" id="what-it-checks" aria-labelledby="what-it-checks-h">
      <div className="lp-copy">
        <h2 id="what-it-checks-h">It finds what is wrong, and shows you why.</h2>
        <p>
          Ten checks run every night. Fixed rules decide what is wrong, with no AI guessing. Each finding names the
          resource and shows the evidence, so you can confirm it yourself.
        </p>
        <ul className="lp-checks">
          {CHECKS.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <p className="lp-more"><Link href="/features/checks">See what each check looks for</Link></p>
      </div>
      <FindingsPanel />
    </section>
  );
}

const STEPS = [
  ["Create a read-only role", "One click creates a role in your own account, from a template you can read first. Today that means AWS."],
  ["OpsAgent reads, and only reads", "The role has no write permissions, so OpsAgent cannot change, stop or delete anything."],
  ["Disconnect whenever you like", "Disconnecting stops OpsAgent from using the role at once. Delete the role to remove it entirely."],
];

export function ReadOnly() {
  return (
    <section className="lp-sec lp-flip" id="read-only" aria-labelledby="read-only-h">
      <div className="lp-copy">
        <h2 id="read-only-h">Read-only, through a role you create.</h2>
        <ol className="lp-steps">
          {STEPS.map(([title, body]) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
        <p className="lp-more"><Link href="/how-it-works">See how it works</Link></p>
      </div>
      <AccessLedger
        foot={<>Three scoped reads are the exceptions. They are listed on the <Link href="/security">Security page</Link>.</>}
      />
    </section>
  );
}

const RHYTHM = [
  ["Every 15 minutes", "Urgent exposures are checked day and night: public snapshots, public databases, open admin ports and audit logging."],
  ["When it is urgent", "One alert in Slack, or by email if Slack is not connected. Owners can switch alerts off per connection."],
  ["Every morning", "One short briefing, exceptions only. It is skipped when nothing changed."],
  ["Every Monday", "A weekly report, by email and in Slack."],
];

export function Delivery() {
  return (
    <section className="lp-sec" id="every-morning" aria-labelledby="every-morning-h">
      <div className="lp-copy">
        <h2 id="every-morning-h">One briefing a morning. An alert only when it cannot wait.</h2>
        <p>Only urgent findings will ever interrupt you, and only on the channels you choose.</p>
        <dl className="lp-rhythm">
          {RHYTHM.map(([when, what]) => (
            <div key={when}>
              <dt>{when}</dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
        <p className="lp-more"><Link href="/features/alerts">More on alerts and briefings</Link></p>
      </div>
      <div className="lp-stack">
        <Live className="lp-stack"><SlackBriefing /><SlackAlert /></Live>
        <p className="mobile-strip">
          OpsAgent for iOS and Android: alerts and briefings in your pocket. <ComingSoon />
        </p>
      </div>
    </section>
  );
}

export function Agent() {
  return (
    <section className="lp-sec lp-flip" id="bring-your-own-ai" aria-labelledby="byo-h">
      <div className="lp-copy">
        <h2 id="byo-h">Your own AI agent can read the same findings.</h2>
        <p>
          Point Claude, Codex, Cursor or any other MCP client at OpsAgent and ask about your cloud in plain words. You
          approve it in your browser, with no API key to paste. Every tool is read-only.
        </p>
        <p className="lp-mcp">
          <span>MCP server</span>
          <code>{MCP_URL}</code>
        </p>
        <p>
          Prefer to stay in the dashboard? Dashboard AI explains findings and answers questions there, once an owner
          turns it on.
        </p>
        <p className="lp-more"><Link href="/docs/connect-your-agent">Connect your agent</Link></p>
      </div>
      <Live><AgentSession /></Live>
    </section>
  );
}

const PLANS = [
  ["Starter", "$99"],
  ["Team", "$299"],
  ["Scale", "$599"],
];

export function PricingPointer() {
  return (
    <section className="lp-sec lp-plain" id="pricing" aria-labelledby="pricing-h">
      <div className="lp-copy">
        <h2 id="pricing-h">A flat price per cloud account.</h2>
        <p>Whatever the size of the account. The Team plan starts with a 14-day free trial.</p>
        <p className="lp-more"><Link href="/pricing">See pricing</Link></p>
      </div>
      <div>
        <dl className="lp-plans">
          {PLANS.map(([name, price]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{price}</dd>
            </div>
          ))}
        </dl>
        <p className="lp-fine">Per cloud account, per month.</p>
        <p className="lp-review">
          Want a person to look? Harun R. Rayhan, a DevOps and AWS consultant, reviews one finding for $99 or one
          connected account for $499, and replies in writing. Nothing is changed in your account.{" "}
          <Link href="/features/ai-and-review">About human review</Link>
        </p>
      </div>
    </section>
  );
}

const TRUST = [
  ["It keeps findings, not your data", "OpsAgent stores inventory metadata, findings and the evidence behind them, on Amazon Web Services in the United States (Oregon)."],
  ["AI stays off until you turn it on", "Dashboard AI is off until an owner turns it on. Agents you connect over MCP use their own model, never OpsAgent's key."],
  ["Secrets are encrypted", "Secrets such as Slack tokens are encrypted with a key that belongs to your organisation alone."],
];

export function Trust() {
  return (
    <section className="lp-sec lp-plain" id="trust" aria-labelledby="trust-h">
      <div className="lp-copy">
        <h2 id="trust-h">What happens to your data.</h2>
        <p className="lp-more"><Link href="/security">Read the Security page</Link></p>
      </div>
      <ul className="lp-facts">
        {TRUST.map(([title, body]) => (
          <li key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
