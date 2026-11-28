import { useId } from "react";
import { dayText, usd, type Total } from "@/lib/cost";
import "./overview.css";

const W = 600;
const H = 150;
const compact = (units: number) => {
  const d = Math.abs(units) / 10_000;
  const s = d >= 1000 ? `${Math.round(d / 100) / 10}k` : String(Math.round(d));
  return `${units < 0 ? "-" : ""}$${s}`;
};
/** A round number at or above `x`, so the line never touches the edge. */
const niceCeil = (x: number) => {
  if (x <= 0) return 0;
  const m = 10 ** Math.floor(Math.log10(x));
  return Math.ceil(x / m) * m;
};

/**
 * The daily total (all services) as a line over an area, like the findings trend. Nothing with fewer than two days.
 * Credits can push a day below zero, so the axis spans the data and always includes zero.
 * shortcut: x is the day's place in the list, so a missing day is not shown as a gap; fine while Cost Explorer returns every day.
 */
export function SpendChart({ totals }: { totals: Total[] }) {
  const fill = useId();
  if (totals.length < 2) return null;
  const hi = niceCeil(Math.max(0, ...totals.map((t) => t.units)));
  const lo = -niceCeil(Math.max(0, ...totals.map((t) => -t.units)));
  const span = hi - lo || 1;
  const y = (units: number) => H - ((units - lo) / span) * H;
  const x = (i: number) => (i / (totals.length - 1)) * W;
  const line = totals.map((t, i) => `${x(i).toFixed(1)},${y(t.units).toFixed(1)}`).join(" ");
  const first = totals[0]!;
  const last = totals.at(-1)!;
  return (
    <figure className="ov-panel ov-trend" aria-labelledby="spend-title">
      <figcaption className="ov-head">
        <p className="ov-title" id="spend-title">Daily total</p>
        <span className="ov-sub">Last {totals.length} days</span>
      </figcaption>
      <div className="ov-plot" aria-hidden="true">
        <div className="ov-canvas">
          {[hi, lo + span / 2, lo].map((n, i) => (
            <span key={i} className="ov-y" style={{ top: `${i * 50}%`, left: -44, width: 36 }}>{compact(n)}</span>
          ))}
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" focusable="false">
            <line x1="0" x2={W} y1="0" y2="0" />
            <line x1="0" x2={W} y1={H / 2} y2={H / 2} />
            <line className="base" x1="0" x2={W} y1={H} y2={H} />
          </svg>
          <svg className="ov-draw" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" focusable="false">
            <defs>
              <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.32 }} />
                <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            <polygon points={`0,${y(0)} ${line} ${W},${y(0)}`} fill={`url(#${fill})`} />
            <polyline className="line" points={line} />
          </svg>
          {totals.map((t, i) => (
            <span key={t.day} className="ov-hit" title={`${dayText(t.day)}: ${usd(t.units)}`} style={{ left: `${(i / (totals.length - 1)) * 100}%`, width: `${100 / (totals.length - 1)}%` }} />
          ))}
        </div>
        <div className="ov-xs"><span>{dayText(first.day)}</span><span>{dayText(last.day)}</span></div>
      </div>
      <table className="ov-sr">
        <caption>Total spend for each of the last {totals.length} days</caption>
        <thead><tr><th scope="col">Day</th><th scope="col">Total (USD)</th></tr></thead>
        <tbody>{totals.map((t) => <tr key={t.day}><td>{dayText(t.day)}</td><td>{usd(t.units)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
