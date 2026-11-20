import type { Metadata } from "next";
import Link from "next/link";
import { SIGNUPS_OPEN } from "@/lib/signups";

export const metadata: Metadata = {
  title: "Terms of service · OpsAgent",
  description: "The terms for using OpsAgent, a read-only ops agent for your cloud run by Binary Labs LLC. Read them before you connect an account.",
};

export default function Terms() {
  return (
    <main className="page">
      <h1>Terms of service</h1>
      <p className="lead">Last updated 20 November 2026</p>
      <p>
        These terms are between you and Binary Labs LLC, which runs OpsAgent. By using OpsAgent you agree to them. If
        you use it for a company, you agree for that company. OpsAgent is for business use. You must be 18 or over
        and able to agree for your company. Our <Link href="/privacy">privacy policy</Link> says how we handle your
        data.
      </p>
      <section>
        <h2>{SIGNUPS_OPEN ? "Early-stage software" : "An alpha service"}</h2>
        <p>
          {SIGNUPS_OPEN ? "OpsAgent is early-stage software." : "OpsAgent is in alpha."} It is provided as is and as available, without warranties of any kind. Features may
          change or stop, checks may miss problems or report ones that aren&apos;t there, and the service may be
          interrupted.
        </p>
      </section>
      <section>
        <h2>What OpsAgent does</h2>
        <p>
          It reads your cloud through a read-only role you create, and it suggests. It never changes anything in your
          cloud: the role has no write permissions.
        </p>
      </section>
      <section>
        <h2>What you are responsible for</h2>
        <ul className="legal-list">
          <li>Your cloud accounts, and the role you create and what it allows.</li>
          <li>Deciding whether to act on a suggestion, and the result if you do. Review a change before you make it.</li>
          <li>The AI provider and key you bring, and what that provider charges you.</li>
          <li>Keeping your sign-in methods safe, and what happens under your account.</li>
        </ul>
        <p>
          If someone brings a claim against Binary Labs LLC because you broke these terms or connected an account you
          had no right to connect, you cover the reasonable cost of it.
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>Don&apos;t:</p>
        <ul className="legal-list">
          <li>connect a cloud account you aren&apos;t authorised to connect;</li>
          <li>break the law, or use OpsAgent to harm others;</li>
          <li>probe, overload or attack the service, or try to reach other customers&apos; data;</li>
          <li>resell or share access to OpsAgent without our agreement.</li>
        </ul>
      </section>
      <section>
        <h2>Billing</h2>
        <ul className="legal-list">
          <li>Paid plans are priced per connected cloud account per month, with a minimum of one account while the plan is active, even when none is connected. The price is on the <Link href="/pricing">pricing page</Link>.</li>
          <li>The free trial lasts 14 days and needs a card. On day 14 it converts to a paid plan and your card is charged, unless you cancel before then.</li>
          <li>Plans renew every month until you cancel.</li>
          <li>You can cancel at any time. The plan stays active until the end of the period you have paid for.</li>
          <li>We do not give partial refunds for a period that has started.</li>
          <li>If the price of your plan changes, we tell you by email at least 30 days before it applies to you. You can cancel before then.</li>
          <li>Dashboard AI top-ups are a one-time purchase of 1,000 credits for US$15. They do not expire while your plan is active, are not refundable, cannot be used after the plan ends, and are removed when the organisation is deleted. If an answer uses more credits than you have left, the difference is taken from your next top-up.</li>
          <li>Stripe is the merchant of record and handles payments and tax. Card details stay with Stripe.</li>
        </ul>
      </section>
      <section>
        <h2>Ending</h2>
        <p>
          You can stop at any time. To stop billing, cancel your plan in Settings &gt; Billing: disconnecting your cloud
          accounts alone does not end the plan. Then disconnect your cloud accounts, delete the role, and ask for
          deletion through the <Link href="/contact">contact form</Link>. We may suspend or close an account that breaks these terms or puts
          the service or other customers at risk, and we may end {SIGNUPS_OPEN ? "the service" : "the alpha"}. When an account closes, its data is deleted
          as the privacy policy describes.
        </p>
      </section>
      <section>
        <h2>Liability</h2>
        <p>
          As far as the law allows, Binary Labs LLC is not liable for indirect, incidental or consequential losses,
          lost profits or lost data. Our total liability for any claim about OpsAgent is limited to the fees you paid
          us for it in the 12 months before the claim, or US$100 if that is more. Nothing in these terms limits
          liability that the law does not allow to be limited.
        </p>
      </section>
      <section>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of the State of Wyoming, USA. Disputes go to the state or federal courts in Wyoming.</p>
      </section>
      <section>
        <h2>General</h2>
        <p>
          These terms and the privacy policy are the whole agreement between you and us about OpsAgent. If one part
          cannot be enforced, the rest stands. You may not transfer this agreement without our consent. We may
          transfer it with the business. If we do not enforce a term once, we have not given it up.
        </p>
      </section>
      <section>
        <h2>Changes and contact</h2>
        <p>
          When these terms change we update this page and the date at the top. If a change is material, we also email
          account owners at least 30 days before it takes effect. Questions go through the{" "}
          <Link href="/contact">contact form</Link>.
        </p>
      </section>
    </main>
  );
}
