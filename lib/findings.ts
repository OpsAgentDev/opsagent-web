import { api, unwrap, type FindingSummary } from "@/lib/api/client";

/**
 * The line above the findings table. Counts come from the page itself, so they are only right when the page holds
 * every row; when more pages exist it shows no numbers rather than wrong ones. Null when there is nothing to count.
 */
export function findingsSummary(items: { severity: string }[], opts: { more: boolean; status: string }): string | null {
  const what = opts.status ? `${opts.status} findings` : "findings";
  if (opts.more) return `${what.charAt(0).toUpperCase()}${what.slice(1)}, most severe first.`;
  if (items.length === 0) return null;
  const n = (s: string) => items.filter((f) => f.severity === s).length;
  const noun = items.length === 1 ? what.replace(/findings$/, "finding") : what;
  return `${items.length} ${noun} · ${n("critical")} critical · ${n("high")} high`;
}

/**
 * Up to `limit` open critical, then high, findings of one connection, or of every connected account when none is named.
 * Brain lists oldest first within a severity.
 */
export async function topIssues(org: string, connection?: string, limit = 3): Promise<FindingSummary[]> {
  const read = (severity: string) =>
    unwrap(api.GET("/orgs/{org}/findings", { params: { path: { org }, query: { connection, status: "open", severity, limit } } }));
  const [critical, high] = await Promise.all([read("critical"), read("high")]);
  return [...critical.items, ...high.items].slice(0, limit);
}
