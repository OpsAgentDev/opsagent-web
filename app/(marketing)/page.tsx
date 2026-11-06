import Link from "next/link";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { AlertDemo } from "@/components/marketing/AlertDemo";
import { ComingSoon } from "@/components/marketing/ComingSoon";
import { PhoneMockup } from "@/components/marketing/PhoneMockup";
import { NumberStrip } from "@/components/marketing/NumberStrip";
import { ProductShots } from "@/components/marketing/ProductShots";
import { Reveal } from "@/components/marketing/Reveal";
import { Checks, HowItWorks, Never } from "@/components/marketing/LandingSections";
import * as I from "@/components/marketing/landing-icons";
import { MCP_URL } from "@/lib/agents";
import "./landing.css";

const DAY_NIGHT = [
  { Icon: I.MoonIcon, title: "While you sleep", body: "Urgent exposures are checked every 15 minutes." },
  { Icon: I.BellIcon, title: "When it's urgent", body: "An alert in Slack, or email if Slack isn't connected." },
  { Icon: I.SunIcon, title: "Every morning", body: "One short briefing, skipped when nothing changed." },
];

export default function Home() {
  return (
    <main>
      <section className="hero" id="waitlist">
        <div className="glow" aria-hidden="true" />
        <div className="hero-text">
          <h1>Your ops teammate that never sleeps.</h1>
          <p className="lead">
            OpsAgent watches your cloud day and night, read-only. Urgent problems reach you the moment they matter.
            Everything else waits for a calm morning briefing. It never changes anything.
          </p>
          <p className="hero-note">
            Checks for urgent exposures every 15 minutes, day and night, and alerts you right away. Everything else waits for the morning briefing.
          </p>
          <WaitlistForm source="landing-hero" />
          <ul className="trust">
            <li style={{ "--i": 0 } as React.CSSProperties}><I.ShieldIcon size={18} />Read-only</li>
            <li style={{ "--i": 1 } as React.CSSProperties}><I.ClockIcon size={18} />Every 15 minutes</li>
            <li style={{ "--i": 2 } as React.CSSProperties}><I.CloudIcon size={18} />No data leaves your account</li>
          </ul>
          <p className="hero-who">
            Built for the founding engineer who owns the cloud bill, and for the developer who inherited the
            infrastructure when the contractor left.
          </p>
        </div>
        <div className="hero-demo">
          <AlertDemo />
        </div>
      </section>

      <NumberStrip />

      <section className="section daynight-row" aria-labelledby="day-night-h">
        <h2 id="day-night-h">While you sleep, and when you wake</h2>
        <ul className="daynight">
          {DAY_NIGHT.map((d) => (
            <li key={d.title}>
              <span className="ico"><d.Icon /></span>
              <h3>{d.title}</h3>
              <p>{d.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <HowItWorks />

      <ProductShots />

      <Checks />

      <Never />

      <section className="section mobile-strip" aria-labelledby="mobile-h">
        <div>
          <h2 id="mobile-h">OpsAgent for iOS and Android: alerts and briefings in your pocket.</h2>
          <ComingSoon />
        </div>
        <PhoneMockup />
      </section>

      <section className="section split band" id="bring-your-own-ai" aria-labelledby="byo-h">
        <div>
          <h2 id="byo-h">Bring your own AI</h2>
          <p className="section-lead">Use Dashboard AI, or bring your own agent or model key.</p>
        </div>
        <div className="byo">
          <p>
            Point Claude, Cursor or any other MCP client at OpsAgent and ask about your findings in plain words. Or ask
            Dashboard AI for explanations and chat, on OpsAgent&apos;s key or your own.
          </p>
          <Reveal className="mcp-url">
            <span>MCP server</span>
            <code style={{ "--n": MCP_URL.length } as React.CSSProperties}>{MCP_URL}</code>
          </Reveal>
          <p>
            <Link href="/docs/connect-your-agent">Connect your agent</Link>
          </p>
        </div>
      </section>

      <section className="section closing" aria-labelledby="closing-h">
        <div className="glow" aria-hidden="true" />
        <h2 id="closing-h">Get your ops teammate.</h2>
        <p className="section-lead">
          The alpha opens to a few teams at a time. Join the waitlist and we will email you when your spot is ready.
        </p>
        <WaitlistForm source="landing-footer" />
      </section>
    </main>
  );
}
