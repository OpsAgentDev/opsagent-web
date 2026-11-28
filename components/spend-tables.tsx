import { OrgLink } from "@/components/org-link";
import { dayText, percentText, signedUsd, usd, type FlaggedDay, type ServiceChange } from "@/lib/cost";

const change = (c: ServiceChange) => `${signedUsd(c.change)}${c.percent === null ? "" : ` (${percentText(c.percent)})`}`;

/** Every service with spend in either period, largest current spend first. No percent without a positive previous. */
export function ServiceTable({ rows }: { rows: ServiceChange[] }) {
  return (
    <section>
      <h2>By service</h2>
      <table data-testid="spend-services">
        <thead>
          <tr><th scope="col">Service</th><th scope="col">Newest 30 days</th><th scope="col">Previous 30 days</th><th scope="col">Change</th></tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.service}><th scope="row">{c.service}</th><td>{usd(c.current)}</td><td>{usd(c.previous)}</td><td>{change(c)}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function MoverList({ title, rows }: { title: string; rows: ServiceChange[] }) {
  return (
    <div>
      <h3>{title}</h3>
      {rows.length === 0 ? <p className="muted">None.</p> : <ul>{rows.map((c) => <li key={c.service}>{c.service}: {change(c)}</li>)}</ul>}
    </div>
  );
}

export function Movers({ up, down }: { up: ServiceChange[]; down: ServiceChange[] }) {
  return (
    <section data-testid="spend-movers">
      <h2>Biggest changes</h2>
      <MoverList title="Up" rows={up} />
      <MoverList title="Down" rows={down} />
    </section>
  );
}

/** Days check 01 flagged as spikes, each linking to its finding(s). Nothing when there are none. */
export function FlaggedDays({ days }: { days: FlaggedDay[] }) {
  if (days.length === 0) return null;
  return (
    <section data-testid="spend-flagged">
      <h2>Flagged days</h2>
      <ul>
        {days.map((d) => (
          <li key={d.day}>
            {dayText(d.day)}{d.units === null ? "" : `, ${usd(d.units)} in total`}:{" "}
            {d.findings.map((f, i) => (
              <span key={f.id}>{i > 0 && ", "}<OrgLink href={`/findings/${f.id}`}>Spike finding</OrgLink> ({f.status})</span>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
