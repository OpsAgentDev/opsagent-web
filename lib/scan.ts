import { api, unwrap } from "@/lib/api/client";

/** `Run.stats` is an untyped object in the contract; for `full_scan` it carries these keys. */
export type ScanStats = { score?: number; counts_by_severity?: Partial<Record<string, number>> };

export type LatestScan = { stats: ScanStats | null; lastFailed: boolean };

const RUNNING = new Set(["queued", "running"]);

const FINISHED = new Set(["done", "partial"]);

/** One finished full scan: when it finished and what it counted. */
export type Scan = { at: string; stats: ScanStats };
/** `running`: the newest run is queued or under way. */
export type ScanHistory = LatestScan & { scans: Scan[]; running: boolean };

/** The trend chart never shows more scans than this. */
export const HISTORY_CAP = 14;

/**
 * The newest finished (`done` or `partial`) full scans with stats, newest first, and whether the newest run of any
 * kind failed. `stats` is the newest scan's. A queued, running or failed run must not hide earlier results.
 * shortcut: one request per scan; move to a brain history endpoint when accounts have months of scans.
 */
export async function scanHistory(org: string, connection: string, cap = HISTORY_CAP): Promise<ScanHistory> {
  const query = { connection, type: "full_scan", limit: cap + 6 };
  const runs = await unwrap(api.GET("/orgs/{org}/runs", { params: { path: { org }, query } }));
  const lastFailed = runs.items[0]?.status === "failed";
  const finished = runs.items.filter((i) => FINISHED.has(i.status)).slice(0, cap);
  const details = await Promise.all(finished.map((r) => unwrap(api.GET("/orgs/{org}/runs/{id}", { params: { path: { org, id: r.id } } }))));
  const scans = finished.flatMap((r, i) => {
    const stats = details[i]?.stats;
    return stats ? [{ at: r.finished_at ?? r.scheduled_at, stats: stats as ScanStats }] : [];
  });
  return { stats: scans[0]?.stats ?? null, lastFailed, scans, running: RUNNING.has(runs.items[0]?.status ?? "") };
}

/**
 * True when any connection of the organisation has a finished full scan; one read.
 * shortcut: looks at the newest 200 runs only, page through `next_cursor` if an org can have more unfinished runs than that.
 */
export async function hasFinishedScan(org: string): Promise<boolean> {
  const query = { type: "full_scan", limit: 200 };
  return (await unwrap(api.GET("/orgs/{org}/runs", { params: { path: { org }, query } }))).items.some((i) => FINISHED.has(i.status));
}

/** Open findings in the run's counts, or null when the run reported none. */
export function openTotal(stats: ScanStats): number | null {
  const counts = stats.counts_by_severity;
  return counts ? Object.values(counts).reduce<number>((a, n) => a + (n ?? 0), 0) : null;
}

export type Overview = { score: number | null; open: number | null; urgent: number | null; connected: number };

/**
 * The dashboard's four tiles from each connection's status and latest scan stats (null: no finished scan yet).
 * Disconnected accounts are left out. Score is the lowest; open and urgent (critical + high) are sums; all three are
 * null until one scan has finished.
 */
export function overview(rows: { status: string; stats?: ScanStats | null }[]): Overview {
  const scanned = rows.filter((r) => r.status !== "disconnected").flatMap((r) => (r.stats ? [r.stats] : []));
  const scores = scanned.flatMap((s) => (typeof s.score === "number" ? [s.score] : []));
  const sum = (pick: (s: ScanStats) => number) => (scanned.length ? scanned.reduce((a, s) => a + pick(s), 0) : null);
  return {
    score: scores.length ? Math.min(...scores) : null,
    open: sum((s) => openTotal(s) ?? 0),
    urgent: sum((s) => (s.counts_by_severity?.critical ?? 0) + (s.counts_by_severity?.high ?? 0)),
    connected: rows.filter((r) => r.status === "connected").length,
  };
}

export type TrendPoint = { at: string; open: number; critical: number };

/**
 * Open findings over time across accounts: one point per finished scan, oldest first, each the sum of every account's
 * newest scan at that moment. Takes each account's scans (any order) and keeps the last `cap` points.
 */
export function trendSeries(accounts: Scan[][], cap = HISTORY_CAP): TrendPoint[] {
  const events = accounts.flatMap((scans, account) => scans.map((s) => ({ account, ...s }))).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const newest = new Map<number, ScanStats>();
  const points = events.map((e) => {
    newest.set(e.account, e.stats);
    const all = [...newest.values()];
    return {
      at: e.at,
      open: all.reduce((a, s) => a + (openTotal(s) ?? 0), 0),
      critical: all.reduce((a, s) => a + (s.counts_by_severity?.critical ?? 0), 0),
    };
  });
  return points.slice(-cap);
}

export type SinceLast = { openDelta: number; newCritical: number };

/**
 * The newest point against the one before it; null with fewer than two scans.
 * shortcut: `newCritical` is the rise in the critical count, so one fixed and one new reads as none; count by
 * first-seen date when brain can filter findings by it.
 */
export function sinceLast(points: TrendPoint[]): SinceLast | null {
  const [prev, last] = points.slice(-2);
  return prev && last ? { openDelta: last.open - prev.open, newCritical: Math.max(0, last.critical - prev.critical) } : null;
}

/** "3 fewer than the previous scan", "1 more than the previous scan" or "Same as the previous scan". */
export function deltaText(delta: number): string {
  return delta === 0 ? "Same as the previous scan" : `${Math.abs(delta)} ${delta < 0 ? "fewer" : "more"} than the previous scan`;
}

/** The dashboard's greeting for an hour of the day (0 to 23). */
export function greeting(hour: number): string {
  return hour >= 5 && hour < 12 ? "Good morning" : hour >= 12 && hour < 18 ? "Good afternoon" : "Good evening";
}
