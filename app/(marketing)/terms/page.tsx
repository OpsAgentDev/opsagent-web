import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of service · OpsAgent",
  description: "The terms for using OpsAgent, a read-only ops agent run by Binary Labs LLC.",
};

export default function Terms() {
  return (
    <main className="page">
      <h1>Terms of service</h1>
      <p className="lead">Last updated 28 October 2026</p>
      <p>
        These terms are between you and Binary Labs LLC, which runs OpsAgent. By using OpsAgent you agree to them. If
        you use it for a company, you agree for that company. Our <Link href="/privacy">privacy policy</Link> says how
        we handle your data.
      </p>
      <section>
        <h2>An alpha service</h2>
        <p>
          OpsAgent is in alpha. It is provided as is and as available, without warranties of any kind. Features may
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
        <h2>Ending</h2>
        <p>
          You can stop at any time: disconnect your cloud accounts, delete the role, and ask for deletion through the{" "}
          <Link href="/contact">contact form</Link>. We may suspend or close an account that breaks these terms or puts
          the service or other customers at risk, and we may end the alpha. When an account closes, its data is deleted
          as the privacy policy describes.
        </p>
      </section>
      <section>
        <h2>Liability</h2>
        <p>
          As far as the law allows, Binary Labs LLC is not liable for indirect, incidental or consequential losses,
          lost profits or lost data. Our total liability for any claim about OpsAgent is limited to the fees you paid
          us for it in the 12 months before the claim.
        </p>
      </section>
      <section>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of the State where Binary Labs LLC is registered.</p>
      </section>
      <section>
        <h2>Changes and contact</h2>
        <p>
          When these terms change we update this page and the date at the top. Questions go through the{" "}
          <Link href="/contact">contact form</Link>.
        </p>
      </section>
    </main>
  );
}
