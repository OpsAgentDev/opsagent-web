import { Mark } from "@/components/brand/Logo";

const FINDINGS = [
  {
    severity: "warn",
    label: "Needs attention",
    title: <>2 IAM keys unused for 180 days</>,
    cites: "Cites the user ci-deploy and the last-used date of each key.",
  },
  {
    severity: "bad",
    label: "High",
    title: (
      <>
        Storage bucket <code>assets-old</code> is publicly readable
      </>
    ),
    cites: "Cites the bucket policy statement that grants public read.",
  },
  {
    severity: "ok",
    label: "OK",
    title: <>Spend on track: $1,240 of $1,300 budget</>,
    cites: "Cites month-to-date spend and your monthly budget.",
  },
];

/** Static example of a morning briefing; the numbers are invented, so it is labelled as a sample. */
export function BriefingCard() {
  return (
    <figure className="briefing" aria-label="Sample briefing">
      <div className="briefing-head">
        <Mark size={28} />
        <div>
          <p className="briefing-title">Morning briefing</p>
          <p className="briefing-meta">Tuesday, 07:00</p>
        </div>
        <span className="briefing-sample">Sample briefing</span>
      </div>
      <ul className="briefing-list">
        {FINDINGS.map((f) => (
          <li key={f.cites}>
            <span className={`dot dot-${f.severity}`} role="img" aria-label={f.label} />
            <div>
              <p className="finding">{f.title}</p>
              <p className="cites">{f.cites}</p>
            </div>
          </li>
        ))}
      </ul>
      <figcaption className="briefing-foot">Read-only. Nothing in your cloud was changed.</figcaption>
    </figure>
  );
}
