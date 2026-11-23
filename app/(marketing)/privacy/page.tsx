import type { Metadata } from "next";
import Link from "next/link";
import { GA_ID } from "@/lib/analytics";
import { HUMAN_REVIEW } from "@/lib/human-review";

export const metadata: Metadata = {
  title: "Privacy policy · OpsAgent",
  description: "What OpsAgent stores about you and your cloud account, where it lives, who processes it, and how to have it deleted.",
};

export default function Privacy() {
  return (
    <main className="page">
      <h1>Privacy policy</h1>
      <p className="lead">Last updated 20 November 2026</p>
      <p>
        OpsAgent is run by Binary Labs LLC. This page says what we store when you use it, why, and what you can ask
        us to do with it. For anything here, use the <Link href="/contact">contact form</Link>.
      </p>
      <section>
        <h2>Who we are</h2>
        <p>
          Binary Labs LLC is a limited liability company in Wyoming, USA. It is the controller of your account data.
          Its postal address is 1309 Coffeen Avenue, Sheridan, WY 82801, USA. Reach it through the <Link href="/contact">contact form</Link>.
        </p>
        <p>
          You decide which cloud accounts to connect. For the cloud data that comes from them, OpsAgent processes it
          for you. A data processing agreement is available on request through the contact form.
        </p>
        <p>OpsAgent is not meant for children.</p>
      </section>
      <section>
        <h2>What we store</h2>
        <ul className="legal-list">
          <li>Your account: email address and name.</li>
          <li>Sign-in identities: the Google or GitHub account you sign in with, and the public keys of your passkeys. A passkey&apos;s private key and any fingerprint or face data never leave your device.</li>
          <li>Your organisation: its name, members and their roles.</li>
          <li>Cloud inventory metadata: what resources exist in the accounts you connect and how they are configured.</li>
          <li>Findings, and the evidence behind them.</li>
          <li>Billing: your plan, trial dates and payment status. Card details stay with Stripe.</li>
          <li>Delivery settings: your Slack workspace and channels, and briefing recipients.</li>
          <li>An audit log of member actions, model calls, agent calls and deliveries, which owners can read under Settings, Audit log, and a record of your own sign-ins.</li>
          <li>Request logs, which include the IP address, requested URL and time of each request. They are kept for 90 days, for security and troubleshooting.</li>
          <li>If you join the waitlist or use the contact form: your email address and message.</li>
          {HUMAN_REVIEW && <li>If you request a human review: your email address, what it is for, and your note, which is emailed to us.</li>}
        </ul>
        <p>
          OpsAgent connects through a read-only role you create. It cannot read object contents, database
          rows, secret or parameter values, log events or function code. What it can read is listed on the <Link href="/security">security page</Link>.
        </p>
      </section>
      <section>
        <h2>Why</h2>
        <p>
          To run the service: sign you in, check your cloud, write your briefings and deliver them. We never sell your
          data, and we don&apos;t use it for advertising.
        </p>
        <p>
          We use your data to provide the service you signed up for and to keep it secure.
          {GA_ID ? " Analytics on the public pages runs only with your consent." : null}
        </p>
      </section>
      <section>
        <h2>Where it lives and how long</h2>
        <p>
          Data is stored on Amazon Web Services, in the United States (Oregon). Encrypted nightly database backups are
          kept there too, in a storage bucket Binary Labs controls. Secrets such as Slack tokens are encrypted with a per-organisation key.
          Data is stored and processed in the United States. If you are in the EU, the UK or elsewhere, your data is
          transferred to the United States.
        </p>
        <p>
          Before anything is stored, strings that look like secrets (keys, tokens, passwords) and email addresses are
          removed from evidence excerpts, resource names and tags. Everything else about a resource, such as its
          identifier, region and configuration, is stored as your cloud reports it.
          Evidence and inventory snapshots expire after 90 days. Findings are kept while your organisation exists.
        </p>
        <p>
          The audit log and delivery records have no time limit: they are kept while your organisation exists and
          are erased with it. Audit entries about your own account, such as sign-ins and passkey changes, are not
          tied to an organisation and are kept with no time limit. Waitlist entries and contact form messages are
          stored, contact form messages are also emailed to us, and both are kept with no time limit. Ask through
          the contact form to have a waitlist entry or a message deleted.
        </p>
      </section>
      <section>
        <h2>Who else processes it</h2>
        <ul className="legal-list">
          <li>Cloudflare: DNS and traffic proxy for opsagent.dev, and Turnstile, the security check on the sign-up, sign-in, waitlist and contact forms.</li>
          <li>Amazon Web Services: hosting, the database and encrypted nightly backups.</li>
          <li>Stripe: payments, subscriptions and tax, as merchant of record. It receives your email and your organisation&apos;s name, and collects your card details.</li>
          <li>Resend: sending sign-in mail, briefings, urgent alerts, invites and account notices.</li>
          <li>Slack: receiving briefings and urgent alerts, when you connect it.</li>
          <li>Google and GitHub: signing you in, when you choose them.</li>
          {GA_ID ? (
            <li>
              Google Analytics: counting visits to the public pages of opsagent.dev, only after you accept its cookies.
              It is never loaded in the signed-in app.
            </li>
          ) : null}
          <li>
            Anthropic: Dashboard AI explanations and chat, only after an owner of your organisation turns Dashboard AI
            on. OpsAgent sends the AI the findings and resources it looks up to answer you, which can include lists across
            your organisation. Anthropic does not train on this data.
          </li>
          <li>
            OpenAI: the backup model provider for Dashboard AI on OpsAgent&apos;s key, used the same way as Anthropic.
          </li>
          <li>
            The AI provider you choose, or the endpoint you configure, if you add your own key: OpsAgent sends that
            provider the context it needs to answer, under your account with them.
          </li>
        </ul>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>
          OpsAgent uses only first-party cookies needed to sign you in and to approve agent connections. No advertising
          cookies.{" "}
          {GA_ID
            ? "On the public pages, Google Analytics sets its cookies only if you accept them in the banner; change your answer any time with \"Cookie settings\" at the foot of the page. If you accept, OpsAgent also sets one first-party cookie, oa_src, holding the campaign tags (utm_source, utm_medium, utm_campaign) and the site that referred you, plus the first page you landed on; it lasts 90 days and is sent with your organisation when you create one, so we know which channel brought you. If you decline, it is not set."
            : "No tracking cookies."}{" "}
          Your browser also
          remembers, in its local storage, if you dismissed the passkey suggestion.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          After a cancel or an ended trial your data stays until you delete the organisation, which an owner does
          under Settings, Account, or by asking through the <Link href="/contact">contact form</Link>; you can delete your own account there too. A deleted
          organisation is erased from the live database after 30 days and leaves the nightly backups within 40 days. We keep a record that the deletion happened, containing no customer data, for one year. An owner can download an export of the organisation&apos;s data as JSON under Settings, Account. Disconnecting a cloud account stops OpsAgent using its role at once.
        </p>
        <p>
          You can ask to see, correct, export or delete your data, or object to how it is used, through the contact
          form. We answer within 30 days. You can also complain to your local data protection authority.
        </p>
        <p>If an incident on our side affects your data, we tell you within 72 hours of confirming it.</p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>When this policy changes we update this page and the date at the top.</p>
      </section>
    </main>
  );
}
