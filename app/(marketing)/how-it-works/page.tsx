import type { Metadata } from "next";
import Link from "next/link";
import { ComingSoon } from "@/components/marketing/ComingSoon";

export const metadata: Metadata = {
  title: "How it works · OpsAgent",
  description: "Connect read-only, checks run, you get a morning briefing. Urgent alerts are coming soon.",
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
            billing and security findings. It cannot read your stored data or change anything. AWS is the first supported
            provider.
          </p>
        </li>
        <li>
          <h2>Checks run</h2>
          <p>
            Today they run every night. Checks are deterministic, with no AI guessing, and every finding cites the
            resource and the evidence.
          </p>
          <p className="step-soon">
            Around the clock: <ComingSoon />
          </p>
        </li>
        <li>
          <h2>
            Urgent alerts <ComingSoon />
          </h2>
          <p>
            Critical findings go to Slack and the mobile app right away, at any hour. You choose what counts as urgent
            and where it goes.
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
