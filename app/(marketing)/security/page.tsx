import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security · OpsAgent",
  description: "OpsAgent is read-only by design: a role you create, no write access, it cannot read your stored data or change anything, except a few scoped reads you opt into.",
};

export default function Security() {
  return (
    <main className="page">
      <h1>Security</h1>
      <section>
        <h2>Read-only by design</h2>
        <p>
          You create the role yourself, from a template you can read before you create it. The role&apos;s trust
          requires an ExternalId that is unique to your connection.
        </p>
      </section>
      <section>
        <h2>What it reads, and what it can&apos;t</h2>
        <p>Watch scans read the same read-only data as the nightly scan, every 15 minutes, and never change anything.</p>
        <p>
          It cannot read your stored data (objects, database rows, secret values) or change anything. The role has no
          write permissions at all, so OpsAgent cannot change, stop or delete anything. Three scoped reads are the
          exceptions:
        </p>
        <ul>
          <li>
            Function and task-definition configuration. It carries environment values, which OpsAgent strips before
            storing, logging or checking anything.
          </li>
          <li>
            Log events, only from log groups you tag <code>opsagent:logs=allow</code>.
          </li>
          <li>
            Terraform state files, only if you turn on drift checks and name the bucket and prefix. State files can
            contain secrets, so name only the prefix you want checked.
          </li>
        </ul>
      </section>
      <section>
        <h2>Your data</h2>
        <p>
          OpsAgent stores inventory metadata, findings and the evidence behind them. It is stored on Railway, in the
          United States.
        </p>
        <p>OpsAgent&apos;s outbound IP addresses are not fixed yet; we will publish them here once they are.</p>
        <p>
          Secrets such as Slack tokens are encrypted with a per-organisation key, which is itself wrapped by a master
          key.
        </p>
      </section>
      <section>
        <h2>AI and your data</h2>
        <p>
          Dashboard AI is off until an owner turns it on. Only then does OpsAgent send the details of the findings and
          resources you ask about to Anthropic to generate answers. Anthropic does not train on this data.
        </p>
        <p>
          Agents you connect over MCP use their own model. MCP traffic never touches OpsAgent&apos;s model key.
        </p>
        <p>
          If you add your own OpenAI or Anthropic key, it is encrypted with your organisation&apos;s key, and only its
          last 4 characters are ever shown again.
        </p>
      </section>
      <section>
        <h2>You stay in control</h2>
        <p>Delete the role at any time. Disconnecting stops OpsAgent from using the role at once. Deleting the stack in your account removes the role entirely.</p>
      </section>
      <section>
        <h2>Reporting a security issue</h2>
        <p>
          Use the <Link href="/contact?topic=security">contact form</Link> and choose Security.
        </p>
      </section>
    </main>
  );
}
