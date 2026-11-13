import type { Overview } from "@/lib/scan";

const dash = (n: number | null | undefined) => n ?? "–";

/** The dashboard's top row. Scan figures read "–" until a first scan has finished. */
export function OverviewTiles({ overview: o, total }: { overview: Overview | null; total: number }) {
  const tiles = [
    { label: "Posture score", value: dash(o?.score), hint: total > 1 ? "Lowest across accounts, out of 100" : "Out of 100, higher is better" },
    { label: "Open findings", value: dash(o?.open), hint: "Across connected accounts" },
    { label: "Critical and high", value: dash(o?.urgent), hint: "Worth fixing first", tone: o?.urgent ? "bad" : undefined },
    { label: "Accounts connected", value: o ? o.connected : "–", hint: o && total > o.connected ? `Of ${total} added` : "Read-only access" },
  ];
  return (
    <dl className="tiles">
      {tiles.map((t) => (
        <div key={t.label} className="tile" data-tone={t.tone}>
          <dt>{t.label}</dt>
          <dd>
            <strong>{t.value}</strong>
            {t.hint}
          </dd>
        </div>
      ))}
    </dl>
  );
}
