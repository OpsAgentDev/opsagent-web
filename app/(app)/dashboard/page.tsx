"use client";
import Link from "next/link";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type Connection } from "@/lib/api/client";
import { SEVERITIES } from "@/lib/api/enums";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";


/** `Run.stats` is an untyped object in the contract; for `full_scan` it carries these keys. */
type ScanStats = { score?: number; counts_by_severity?: Partial<Record<string, number>> };

// Two small reads (latest run id, then its stats) instead of paging every open finding.
async function latestScanStats(org: string, connection: string): Promise<ScanStats | null> {
  const query = { connection, type: "full_scan", limit: 1 };
  const runs = await unwrap(api.GET("/orgs/{org}/runs", { params: { path: { org }, query } }));
  const last = runs.items[0];
  if (!last) return null;
  const run = await unwrap(api.GET("/orgs/{org}/runs/{id}", { params: { path: { org, id: last.id } } }));
  return (run.stats ?? null) as ScanStats | null;
}

function ConnectionCard({ org, c }: { org: string; c: Connection }) {
  const { data: stats, error } = useApi(() => latestScanStats(org, c.id), [org, c.id]);
  return (
    <div className="card">
      <h3>
        <Link href={`/connections/${c.id}`}>{c.display_name ?? c.id}</Link>
      </h3>
      <p className="muted">
        {c.provider} · {c.status}
      </p>
      <ErrorNote error={error} />
      {stats === null && <p className="muted">No scan results yet.</p>}
      {stats && (
        <>
          <p>
            Posture score <strong>{stats.score ?? "–"}</strong>
          </p>
          <table>
            <tbody>
              {SEVERITIES.map((s) => (
                <tr key={s}>
                  <td>{s}</td>
                  <td>{stats.counts_by_severity?.[s] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const org = useOrg();
  const { data: connections, error } = useApi(
    () => unwrap(api.GET("/orgs/{org}/connections", { params: { path: { org: org.slug } } })),
    [org.slug],
  );
  return (
    <main>
      <h1>Dashboard</h1>
      <ErrorNote error={error} />
      {connections?.length === 0 && (
        <p>
          No cloud account yet. <Link href="/onboarding/connect-aws">Connect an AWS account</Link>
        </p>
      )}
      <div className="cards">
        {connections?.map((c) => <ConnectionCard key={c.id} org={org.slug} c={c} />)}
      </div>
      {!!connections?.length && (
        <p>
          <Link href="/onboarding/connect-aws">Connect another account</Link>
        </p>
      )}
    </main>
  );
}
