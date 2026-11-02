import Image from "next/image";

const FACTS = ["15+ years", "160+ clients", "All 12 AWS certifications"];
const SPECIALISMS = ["AWS (network, compute, cost)", "Terraform and CI/CD", "Docker and Kubernetes", "Production monitoring"];
const CLIENTS = ["L'Oréal", "Kiehl's", "Samsung", "Prudential", "Lonza", "Fleetcor", "NCR"];
const QUOTES = [
  { text: "Harun is an amazing developer. He takes instruction well, takes pride in his work, and is easy to work with. I would recommend Harun without hesitation.", who: "Alen B.", role: "CEO & Co-Founder, Social HP" },
  { text: "Harun was instrumental in a series of complex infrastructure upgrades. He made a stressful project feel manageable and delivered high-quality engineering work.", who: "Tyler P.", role: "CEO, SRM Inc." },
  { text: "Harun is an expert and is very good at what he does.", who: "Jason L.", role: "Founder, United Innovations" },
  { text: "Harun is a superb professional to work with, responsive, punctual, and careful about understanding project requirements.", who: "Joel G.", role: "CEO, Trinax SG" },
];

/** Static reviewer profile. No links of any kind: it stays inside the dashboard. */
export function ReviewerProfile() {
  return (
    <section className="profile" aria-label="Your reviewer">
      <div className="profile-head">
        <Image src="/reviewer/harun.jpg" alt="Harun R. Rayhan" width={112} height={112} className="profile-photo" priority />
        <div>
          <h2>Harun R. Rayhan</h2>
          <p className="profile-headline">DevOps and AWS consultant. I design, ship and run AWS infrastructure.</p>
          <ul className="chips" aria-label="Facts">
            {FACTS.map((f) => <li key={f} className="chip strong">{f}</li>)}
          </ul>
        </div>
      </div>
      <h3>Specialisms</h3>
      <ul className="chips">{SPECIALISMS.map((s) => <li key={s} className="chip">{s}</li>)}</ul>
      <h3>Worked with</h3>
      <p className="muted">{CLIENTS.join(" · ")}</p>
      <h3>Case study</h3>
      <p>
        <strong>Polaris</strong>, a 15-year-old ERP moved off Zend Framework 1, now &ldquo;noticeably faster for
        day-to-day operations&rdquo;.
      </p>
      <h3>What clients say</h3>
      <div className="quotes">
        {QUOTES.map((q) => (
          <figure key={q.who} className="quote">
            <blockquote>&ldquo;{q.text}&rdquo;</blockquote>
            <figcaption><strong>{q.who}</strong> <span className="muted">{q.role}</span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
