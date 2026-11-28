// Pure arithmetic for the Spend page. Amounts are integers in ten-thousandths of a dollar (brain sends
// four decimals), so sums are exact; only display rounds, to cents. Windows are anchored on `newest_day`,
// never on today, because the stored data can trail by days.
import type { CostSeries } from "@/lib/api/client";

type Row = CostSeries["days"][number];
export type Flag = CostSeries["flagged"][number];
export type Total = { day: string; units: number };
export type ServiceChange = { service: string; current: number; previous: number; change: number; percent: number | null };
export type FlaggedDay = { day: string; units: number | null; findings: { id: string; status: string }[] };

export const WINDOW_DAYS = 30;
const UNITS = 10_000;

/** "12.3400" or "-1.5" to ten-thousandths; null for anything else, so a malformed row never becomes NaN. */
export function parseUsd(s: string): number | null {
  const m = /^(-?)(\d{1,10})(?:\.(\d{1,4}))?$/.exec(s.trim());
  if (!m) return null;
  const units = Number(m[2]) * UNITS + Number((m[3] ?? "").padEnd(4, "0"));
  return m[1] ? -units : units;
}

const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`) / 86_400_000;

/** Rows with a readable amount; an unreadable one is dropped rather than poisoning every total. */
function readable(rows: Row[]): { day: string; service: string; units: number }[] {
  return rows.flatMap((r) => {
    const units = parseUsd(r.amount_usd);
    return units === null ? [] : [{ day: r.day, service: r.service, units }];
  });
}

/** All services summed per day, oldest first. */
export function dailyTotals(rows: Row[]): Total[] {
  const byDay = new Map<string, number>();
  for (const r of readable(rows)) byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.units);
  return [...byDay].map(([day, units]) => ({ day, units })).sort((a, b) => a.day.localeCompare(b.day));
}

/** The newest 30 days ending on `newest`, and the 30 before them. Days with no rows simply do not count. */
export function periods(rows: Row[], newest: string) {
  const end = dayNumber(newest);
  const age = (day: string) => end - dayNumber(day);
  const inRows = readable(rows).filter((r) => age(r.day) >= 0 && age(r.day) < 2 * WINDOW_DAYS);
  const current = inRows.filter((r) => age(r.day) < WINDOW_DAYS);
  const previous = inRows.filter((r) => age(r.day) >= WINDOW_DAYS);
  const sum = (xs: { units: number }[]) => xs.reduce((n, x) => n + x.units, 0);
  const count = (xs: { day: string }[]) => new Set(xs.map((x) => x.day)).size;
  return { current, previous, currentTotal: sum(current), previousTotal: sum(previous), currentDays: count(current), previousDays: count(previous) };
}

/** Per service: newest 30 days, the 30 before, and the change. Largest current spend first. No percent from a previous of zero or less. */
export function serviceChanges(rows: Row[], newest: string): ServiceChange[] {
  const p = periods(rows, newest);
  const totals = new Map<string, { current: number; previous: number }>();
  const add = (list: { service: string; units: number }[], key: "current" | "previous") => {
    for (const r of list) {
      const t = totals.get(r.service) ?? { current: 0, previous: 0 };
      t[key] += r.units;
      totals.set(r.service, t);
    }
  };
  add(p.current, "current");
  add(p.previous, "previous");
  return [...totals]
    .map(([service, t]) => {
      const change = t.current - t.previous;
      const percent = t.previous > 0 ? (Math.sign(change) * Math.round((Math.abs(change) / t.previous) * 1000)) / 10 : null;
      return { service, ...t, change, percent };
    })
    .sort((a, b) => b.current - a.current || a.service.localeCompare(b.service));
}

/** The services that grew most and fell most (dollars), at most `n` each; unchanged services are in neither. */
export function movers(changes: ServiceChange[], n = 3) {
  const by = (a: ServiceChange, b: ServiceChange) => Math.abs(b.change) - Math.abs(a.change) || a.service.localeCompare(b.service);
  return {
    up: changes.filter((c) => c.change > 0).sort(by).slice(0, n),
    down: changes.filter((c) => c.change < 0).sort(by).slice(0, n),
  };
}

/** One entry per flagged day, newest first, with that day's total when it is stored and every finding for the day. */
export function flaggedDays(flagged: Flag[], totals: Total[]): FlaggedDay[] {
  const spend = new Map(totals.map((t) => [t.day, t.units]));
  const byDay = new Map<string, FlaggedDay>();
  for (const f of flagged) {
    const d = byDay.get(f.day) ?? { day: f.day, units: spend.get(f.day) ?? null, findings: [] };
    d.findings.push({ id: f.finding_id, status: f.status });
    byDay.set(f.day, d);
  }
  return [...byDay.values()].sort((a, b) => b.day.localeCompare(a.day));
}

/** "$1,234.57"; "-$1.50" for credits. Rounds half away from zero, to cents. */
export function usd(units: number): string {
  const cents = Math.round(Math.abs(units) / 100);
  const text = (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return units < 0 && cents > 0 ? `-${text}` : text;
}

/** "+$12.00" / "-$3.20" / "$0.00". */
export function signedUsd(units: number): string {
  const text = usd(units);
  return units > 0 && !text.startsWith("-") && text !== "$0.00" ? `+${text}` : text;
}

/** "+12.5%" / "-3.0%"; "n/a" when there is no base to compare with. */
export function percentText(percent: number | null): string {
  return percent === null ? "n/a" : `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

/** "30 Nov 2026" from a date-only string, in UTC so the day never shifts with the viewer's zone. */
export function dayText(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
