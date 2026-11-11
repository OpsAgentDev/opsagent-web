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

/** True when the connection has any full scan, finished or not; one small read. */
export async function hasScanRun(org: string, connection: string): Promise<boolean> {
  const query = { connection, type: "full_scan", limit: 1 };
  return (await unwrap(api.GET("/orgs/{org}/runs", { params: { path: { org }, query } }))).items.length > 0;
}

/** Open findings in the run's counts, or null when the run reported none. */
export function openTotal(stats: ScanStats): number | null {
  const counts = stats.counts_by_severity;
  return counts ? Object.values(counts).reduce<number>((a, n) => a + (n ?? 0), 0) : null;
}
