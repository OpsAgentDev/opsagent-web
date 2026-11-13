import { useId, type CSSProperties, type ReactNode } from "react";
import { BellIcon, CloudIcon, FlagIcon, ShieldIcon } from "@/components/marketing/landing-icons";
import { deltaText, type Overview, type SinceLast } from "@/lib/scan";
import "./overview.css";

/**
 * A number that counts up once, in CSS (overview.css). The real value is the element's text from the start, for
 * screen readers and tests; the moving digits are drawn over it. "–" while there is no number.
 */
export function Count({ value }: { value: number | null | undefined }) {
  if (typeof value !== "number") return <>–</>;
  // The second custom property is the value plus one, for the landing sample's "a finding arrived" tick.
  return <span className="ov-count" style={{ "--to": value, "--next": value + 1 } as CSSProperties}><span>{value}</span></span>;
}

/** A score out of 100 as a ring with the number inside; an empty track and "–" until there is one. */
export function ScoreRing({ score, small }: { score: number | null | undefined; small?: boolean }) {
  const stroke = useId();
  return (
    <span className={small ? "ov-ring small" : "ov-ring"}>
      <svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={stroke} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--accent-2)" }} />
            <stop offset="1" style={{ stopColor: "var(--accent)" }} />
          </linearGradient>
        </defs>
        <circle cx="18" cy="18" r="15.5" />
        {typeof score === "number" && score > 0 && (
          <circle className="value" cx="18" cy="18" r="15.5" pathLength={100} style={{ stroke: `url(#${stroke})` }} strokeDasharray={`${Math.min(100, score)} 100`} transform="rotate(-90 18 18)" />
        )}
      </svg>
      <strong><Count value={score} /></strong>
    </span>
  );
}

function Tile({ label, icon, tone, score, children }: { label: string; icon: ReactNode; tone?: string; score?: boolean; children: ReactNode }) {
  return (
    <div className={score ? "tile score" : "tile"} data-tone={tone}>
      <dt><span className="ov-chip" aria-hidden="true">{icon}</span>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** The dashboard's top row. Scan figures read "–" until a first scan has finished; `since` is known from the second scan on. */
export function OverviewTiles({ overview: o, total, since }: { overview: Overview | null; total: number; since?: SinceLast | null }) {
  return (
    <dl className="ov-tiles">
      <Tile label="Posture score" icon={<ShieldIcon size={15} />} score>
        <ScoreRing score={o?.score} />
        <span>{total > 1 ? "Lowest across accounts, out of 100" : "Out of 100, higher is better"}</span>
      </Tile>
      <Tile label="Open findings" icon={<FlagIcon size={15} />}>
        <strong><Count value={o?.open} /></strong>
        <span data-tone={since && since.openDelta < 0 ? "good" : undefined}>{since ? deltaText(since.openDelta) : "Across connected accounts"}</span>
      </Tile>
      <Tile label="Critical and high" icon={<BellIcon size={15} />} tone={o?.urgent ? "bad" : undefined}>
        <strong><Count value={o?.urgent} /></strong>
        <span>{since?.newCritical ? `${since.newCritical} new critical since the previous scan` : "Worth fixing first"}</span>
      </Tile>
      <Tile label="Accounts connected" icon={<CloudIcon size={15} />}>
        <strong><Count value={o ? o.connected : null} /></strong>
        <span>{o && total > o.connected ? `Of ${total} added` : "Read-only access"}</span>
      </Tile>
    </dl>
  );
}
