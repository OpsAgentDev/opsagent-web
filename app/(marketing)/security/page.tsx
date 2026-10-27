import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security · OpsAgent",
  description: "OpsAgent is read-only by design: a role you create, no write access, no reading of your data.",
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
        <h2>What it can never touch</h2>
        <p>
          Object contents and database rows. The role has no write permissions at all, so OpsAgent cannot change,
          stop or delete anything.
        </p>
        <p>
          One exception to know about: reading function and task-definition configuration returns their environment
          values. OpsAgent strips those before storing, logging or checking anything.
        </p>
      </section>
      <section>
        <h2>Your data</h2>
        <p>
          OpsAgent stores inventory metadata, findings and the evidence behind them. It is stored on Railway, in the
          United States.
        </p>
        <p>
          Secrets such as Slack tokens are encrypted with a per-organisation key, which is itself wrapped by a master
          key.
        </p>
      </section>
      <section>
        <h2>Your AI, your keys</h2>
        <p>OpsAgent never pays for or resells inference. You bring your own agent or model key.</p>
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
