import { useId } from "react";
import type { TrendPoint } from "@/lib/scan";
import "./overview.css";

const W = 600;
const H = 150;
const day = (at: string) => new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
/** The axis top: the largest count, rounded up to a round number so the line never touches the edge. */
const ceiling = (max: number) => (max <= 5 ? 5 : Math.ceil(max / 5) * 5);

/**
 * Open findings per finished scan as a line over an area, from zero. Nothing with fewer than two scans.
 * The drawing is hidden from screen readers, which get the same numbers as a table.
 */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const fill = useId();
  if (points.length < 2) return null;
  const top = ceiling(Math.max(...points.map((p) => p.open)));
  const y = (open: number) => H - (open / top) * H;
  const line = points.map((p, i) => `${((i / (points.length - 1)) * W).toFixed(1)},${y(p.open).toFixed(1)}`).join(" ");
  const first = points[0]!;
  const last = points.at(-1)!;
  return (
    <figure className="ov-panel ov-trend" aria-labelledby="trend-title">
      <figcaption className="ov-head">
        {/* Not a heading: the landing page shows this chart inside its hero. The figure is named by it. */}
        <p className="ov-title" id="trend-title">Open findings</p>
        <span className="ov-sub">Last {points.length} scans</span>
      </figcaption>
      <div className="ov-plot" aria-hidden="true">
        <div className="ov-canvas">
          {[top, top / 2, 0].map((n, i) => <span key={n} className="ov-y" style={{ top: `${i * 50}%` }}>{n}</span>)}
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" focusable="false">
            <line x1="0" x2={W} y1="0" y2="0" />
            <line x1="0" x2={W} y1={H / 2} y2={H / 2} />
            <line className="base" x1="0" x2={W} y1={H} y2={H} />
          </svg>
          {/* The data sits on its own layer so it can be revealed left to right, once (overview.css). */}
          <svg className="ov-draw" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" focusable="false">
            <defs>
              <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.32 }} />
                <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            <polygon points={`0,${H} ${line} ${W},${H}`} fill={`url(#${fill})`} />
            <polyline className="line" points={line} />
          </svg>
          {/* One hover column per scan; the browser's own tooltip shows the date and count. */}
          {points.map((p, i) => (
            <span key={i} className="ov-hit" title={`${day(p.at)}: ${p.open} open`} style={{ left: `${(i / (points.length - 1)) * 100}%`, width: `${100 / (points.length - 1)}%` }} />
          ))}
          <span className="ov-end" style={{ top: `${(y(last.open) / H) * 100}%` }}><b>{last.open}</b></span>
        </div>
        <div className="ov-xs"><span>{day(first.at)}</span><span>{day(last.at)}</span></div>
      </div>
      <table className="ov-sr">
        <caption>Open findings after each of the last {points.length} scans</caption>
        <thead><tr><th scope="col">Scan finished</th><th scope="col">Open findings</th></tr></thead>
        <tbody>{points.map((p, i) => <tr key={i}><td>{new Date(p.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td><td>{p.open}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
