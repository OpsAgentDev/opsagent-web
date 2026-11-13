import { api, unwrap } from "@/lib/api/client";

/** `Run.stats` is an untyped object in the contract; for `full_scan` it carries these keys. */
export type ScanStats = { score?: number; counts_by_severity?: Partial<Record<string, number>> };

export type LatestScan = { stats: ScanStats | null; lastFailed: boolean };

const FINISHED = new Set(["done", "partial"]);

/**
 * Stats of the newest finished (`done` or `partial`) full scan with stats, and whether the newest run of any
 * kind failed. A queued, running or failed run must not hide earlier results. Reads a few runs, then one detail.
 */
export async function latestScanStats(org: string, connection: string): Promise<LatestScan> {
  const query = { connection, type: "full_scan", limit: 5 };
  const runs = await unwrap(api.GET("/orgs/{org}/runs", { params: { path: { org }, query } }));
  const lastFailed = runs.items[0]?.status === "failed";
  for (const r of runs.items.filter((i) => FINISHED.has(i.status))) {
    const run = await unwrap(api.GET("/orgs/{org}/runs/{id}", { params: { path: { org, id: r.id } } }));
    if (run.stats) return { stats: run.stats as ScanStats, lastFailed };
  }
  return { stats: null, lastFailed };
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
