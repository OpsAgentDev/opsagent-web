import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it works · OpsAgent",
  description: "Connect read-only, checks run, you get a morning briefing. Urgent problems alert you right away.",
};

export default function HowItWorks() {
  return (
    <main className="page">
      <h1>How it works</h1>
      <p className="lead">Five steps, from a read-only role to answers from your own AI agent.</p>
      <ol className="prose-steps">
        <li>
          <h2>Connect read-only</h2>
          <p>
            You create one role in your cloud account in one click. It can list and describe resources and read
            billing and security findings. It cannot read your stored data or change anything, with a few opt-in exceptions listed on the Security page. AWS is the first supported
            provider.
          </p>
        </li>
        <li>
          <h2>Checks run</h2>
          <p>
            A full scan runs every night. Checks are deterministic, with no AI guessing, and every finding cites the
            resource and the evidence.
          </p>
          <p>Checks for urgent exposures every 15 minutes, day and night, and alerts you right away. Everything else waits for the morning briefing.</p>
        </li>
        <li>
          <h2>Urgent alerts</h2>
          <p>
            New critical findings go to Slack right away, at any hour, or by email to the owners if Slack isn&apos;t
            connected. Owners can switch urgent alerts off per connection in settings.
          </p>
        </li>
        <li>
          <h2>Morning briefing and weekly report</h2>
          <p>Exceptions only, in Slack and email. Skipped when nothing changed.</p>
        </li>
        <li>
          <h2>Ask it anything</h2>
          <p>
            Point your own AI agent at OpsAgent over MCP, or chat with it in the dashboard using your own model key.{" "}
            <Link href="/docs/connect-your-agent">Connect your agent</Link>.
          </p>
        </li>
      </ol>
    </main>
  );
}
