import { CountUp } from "@/components/marketing/CountUp";
import { Reveal } from "@/components/marketing/Reveal";

// Each figure restates a claim made elsewhere on the page.
const FIGURES: { n: number; unit?: string; caption: string }[] = [
  { n: 15, unit: " min", caption: "between urgent exposure checks, day and night" },
  { n: 10, caption: "checks run every night against your account" },
  { n: 0, caption: "write permissions: it cannot change anything" },
  { n: 1, caption: "short briefing a morning, skipped when nothing changed" },
];

export function NumberStrip() {
  return (
    <Reveal as="section" className="numbers band" aria-label="OpsAgent in numbers">
      <ul>
        {FIGURES.map((f, i) => (
          <li key={f.caption} className="rv" style={{ "--i": i * 2 } as React.CSSProperties}>
            <strong>
              <CountUp to={f.n} />
              {f.unit && <span className="unit">{f.unit}</span>}
            </strong>
            <span>{f.caption}</span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
