import { SignupCta } from "@/components/marketing/SignupCta";
import { Agent, Checks, Delivery, PricingPointer, ReadOnly, Trust } from "@/components/marketing/LandingSections";
import { DashboardSample } from "@/components/marketing/LandingVisuals";
import { closingLine } from "@/lib/signups";
import "./home.css";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OpsAgent",
  url: "https://opsagent.dev",
  logo: "https://opsagent.dev/icon.svg",
  description: "A read-only ops agent for your cloud.",
};

export default function Home() {
  return (
    <main className="lp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      {/* Every "Join the waitlist" link on the site points at #waitlist. */}
      <section className="hero" id="waitlist">
        <div className="hero-text">
          <p className="hero-pill">Read-only. It never changes anything.</p>
          <h1>Your ops teammate that never sleeps.</h1>
          <p className="lead">
            OpsAgent is a read-only agent for teams with no ops person. It scans your cloud every night and sends one
            short briefing each morning. It never changes anything. Today it connects to AWS.
          </p>
          <SignupCta source="landing-hero" />
          <p className="hero-note">
            Checks for urgent exposures every 15 minutes, day and night, and alerts you right away. Everything else waits for the morning briefing.
          </p>
          <p className="hero-who">
            Built for the founding engineer who owns the cloud bill, and for the developer who inherited the
            infrastructure when the contractor left.
          </p>
        </div>
        <DashboardSample />
      </section>

      <Checks />
      <ReadOnly />
      <Delivery />
      <Agent />
      <PricingPointer />
      <Trust />

      <section className="lp-closing" aria-labelledby="closing-h">
        <h2 id="closing-h">Get your ops teammate.</h2>
        <p>{closingLine()}</p>
        <SignupCta source="landing-footer" />
      </section>
    </main>
  );
}
