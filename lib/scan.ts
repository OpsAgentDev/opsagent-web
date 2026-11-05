import { api, unwrap } from "@/lib/api/client";

/** `Run.stats` is an untyped object in the contract; for `full_scan` it carries these keys. */
export type ScanStats = { score?: number; counts_by_severity?: Partial<Record<string, number>> };

// Two small reads (latest run id, then its stats) instead of paging every open finding.
export async function latestScanStats(org: string, connection: string): Promise<ScanStats | null> {
  const query = { connection, type: "full_scan", limit: 1 };
  const runs = await unwrap(api.GET("/orgs/{org}/runs", { params: { path: { org }, query } }));
  const last = runs.items[0];
  if (!last) return null;
  const run = await unwrap(api.GET("/orgs/{org}/runs/{id}", { params: { path: { org, id: last.id } } }));
  return (run.stats ?? null) as ScanStats | null;
}
