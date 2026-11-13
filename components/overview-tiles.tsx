import { deltaText, type Overview, type SinceLast } from "@/lib/scan";
import "./overview.css";

const dash = (n: number | null | undefined) => n ?? "–";
const R = 15.5;
const AROUND = 2 * Math.PI * R;

/** A score out of 100 as a ring with the number inside; an empty track and "–" until there is one. */
export function ScoreRing({ score, small }: { score: number | null | undefined; small?: boolean }) {
  return (
    <span className={small ? "ov-ring small" : "ov-ring"}>
      <svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">
        <circle cx="18" cy="18" r={R} />
        {typeof score === "number" && score > 0 && (
          <circle className="value" cx="18" cy="18" r={R} strokeDasharray={`${(Math.min(100, Math.max(0, score)) / 100) * AROUND} ${AROUND}`} transform="rotate(-90 18 18)" />
        )}
      </svg>
      <strong>{dash(score)}</strong>
    </span>
  );
}

/** The dashboard's top row. Scan figures read "–" until a first scan has finished; `since` is known from the second scan on. */
export function OverviewTiles({ overview: o, total, since }: { overview: Overview | null; total: number; since?: SinceLast | null }) {
  const tone = since && since.openDelta < 0 ? "good" : undefined;
  return (
    <dl className="ov-tiles">
      <div className="tile score">
        <dt>Posture score</dt>
        <dd>
          <ScoreRing score={o?.score} />
          <span>{total > 1 ? "Lowest across accounts, out of 100" : "Out of 100, higher is better"}</span>
        </dd>
      </div>
      <div className="tile">
        <dt>Open findings</dt>
        <dd>
          <strong>{dash(o?.open)}</strong>
          <span data-tone={tone}>{since ? deltaText(since.openDelta) : "Across connected accounts"}</span>
        </dd>
      </div>
      <div className="tile" data-tone={o?.urgent ? "bad" : undefined}>
        <dt>Critical and high</dt>
        <dd>
          <strong>{dash(o?.urgent)}</strong>
          <span>{since?.newCritical ? `${since.newCritical} new critical since the previous scan` : "Worth fixing first"}</span>
        </dd>
      </div>
      <div className="tile">
        <dt>Accounts connected</dt>
        <dd>
          <strong>{o ? o.connected : "–"}</strong>
          <span>{o && total > o.connected ? `Of ${total} added` : "Read-only access"}</span>
        </dd>
      </div>
    </dl>
  );
}
