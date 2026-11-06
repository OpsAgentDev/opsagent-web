import Image from "next/image";
import { Reveal } from "@/components/marketing/Reveal";

// Captured from the e2e stack with a seeded test identity (Acme Platform, alex@acme.dev); no real data.
const SHOTS = [
  {
    key: "dashboard",
    label: "Dashboard",
    src: "/landing/dashboard.webp",
    width: 1380,
    height: 1530,
    alt: "Sample OpsAgent dashboard: setup checklist and the acme-prod account with its posture score and open findings by severity",
    caption: "Posture score and open findings by severity, per connected account.",
  },
  {
    key: "finding",
    label: "Finding",
    src: "/landing/finding.webp",
    width: 1040,
    height: 1110,
    alt: "Sample OpsAgent finding: a critical certificate expiring in 3 days, with its next step and the evidence it was based on",
    caption: "Every finding names the resource, the next step and its evidence.",
  },
  {
    key: "briefing",
    label: "Morning briefing",
    src: "/landing/briefing.webp",
    width: 900,
    height: 500,
    alt: "Sample OpsAgent morning briefing email for acme-prod, listing open findings by severity with a link to the dashboard",
    caption: "The morning briefing, by email when Slack is not connected.",
  },
];

export function ProductShots() {
  return (
    <section className="section band" id="product" aria-labelledby="product-h">
      <h2 id="product-h">Inside OpsAgent</h2>
      <p className="section-lead">Sample screens from a test account: the dashboard, one finding, and the briefing it sends.</p>
      <Reveal className="shots">
        {SHOTS.map((s, i) => (
          <figure key={s.key} className={`shot shot-${s.key} rv`} style={{ "--i": i * 3 } as React.CSSProperties}>
            <div className="shot-frame">
              <div className="shot-bar" aria-hidden="true">
                <span /><span /><span />
                <em>{s.label}</em>
              </div>
              <span className="shot-sample">Sample data</span>
              <Image src={s.src} width={s.width} height={s.height} alt={s.alt} sizes="(max-width: 800px) 100vw, 640px" unoptimized />
            </div>
            <figcaption>{s.caption}</figcaption>
          </figure>
        ))}
      </Reveal>
    </section>
  );
}
