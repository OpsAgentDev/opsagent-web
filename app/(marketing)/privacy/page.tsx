import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy · OpsAgent",
  description: "What OpsAgent stores, where it lives, who processes it, and how to have it deleted.",
};

export default function Privacy() {
  return (
    <main className="page">
      <h1>Privacy policy</h1>
      <p className="lead">Last updated 28 October 2026</p>
      <p>
        OpsAgent is run by Binary Labs LLC. This page says what we store when you use it, why, and what you can ask
        us to do with it. For anything here, use the <Link href="/contact">contact form</Link>.
      </p>
      <section>
        <h2>What we store</h2>
        <ul className="legal-list">
          <li>Your account: email address and name.</li>
          <li>Sign-in identities: the Google or GitHub account you sign in with, and the public keys of your passkeys. A passkey&apos;s private key and any fingerprint or face data never leave your device.</li>
          <li>Your organisation: its name, members and their roles.</li>
          <li>Cloud inventory metadata: what resources exist in the accounts you connect and how they are configured.</li>
          <li>Findings, and the evidence behind them.</li>
          <li>Delivery settings: your Slack workspace and channels, and briefing recipients.</li>
          <li>An audit log of sign-ins, member actions, model calls, agent calls and deliveries, which you can view.</li>
          <li>If you join the waitlist or use the contact form: your email address and message.</li>
        </ul>
        <p>
          OpsAgent connects through a read-only role you create. It cannot read your stored data (objects, database
          rows, secret values). The few scoped reads it can make are listed on the <Link href="/security">security page</Link>.
        </p>
      </section>
      <section>
        <h2>Why</h2>
        <p>
          To run the service: sign you in, check your cloud, write your briefings and deliver them. We never sell your
          data, and we don&apos;t use it for advertising.
        </p>
      </section>
      <section>
        <h2>Where it lives and how long</h2>
        <p>
          Data is stored on Railway, in the United States. Encrypted nightly database backups are kept on Amazon Web
          Services, in a storage bucket Binary Labs controls. Secrets such as Slack tokens are encrypted with a per-organisation key.
        </p>
        <p>
          Evidence excerpts are stripped of secret-shaped strings and common personal data before they are stored.
          Evidence and inventory snapshots expire after 90 days. Findings are kept while your organisation exists.
        </p>
      </section>
      <section>
        <h2>Who else processes it</h2>
        <ul className="legal-list">
          <li>Railway: hosting and the database.</li>
          <li>Cloudflare: DNS and traffic proxy for opsagent.dev.</li>
          <li>Amazon Web Services: encrypted nightly backups, in a storage bucket Binary Labs controls.</li>
          <li>Resend: sending sign-in and briefing email.</li>
          <li>Slack: delivering briefings, when you connect it.</li>
          <li>Google and GitHub: signing you in, when you choose them.</li>
          <li>
            The AI provider you choose: you bring your own key, and OpsAgent sends that provider the context it needs
            to answer, under your account with them.
          </li>
        </ul>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>
          OpsAgent uses only first-party cookies needed to sign you in and to approve agent connections. No advertising
          or tracking cookies. Your browser also
          remembers, in its local storage, if you dismissed the passkey suggestion.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          Ask through the <Link href="/contact">contact form</Link> and we will delete your account and your
          organisation&apos;s data within 30 days. You can also ask for an export of your organisation&apos;s data as JSON, delivered within 30
          days. Disconnecting a cloud account stops OpsAgent using its role at once.
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
