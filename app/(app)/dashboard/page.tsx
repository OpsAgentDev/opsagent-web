"use client";
import Link from "next/link";
import { Severity, Status } from "@/components/badges";
import { ErrorNote } from "@/components/error-note";
import { SetupChecklist } from "@/components/setup-checklist";
import { api, unwrap, type Connection } from "@/lib/api/client";
import { SEVERITIES } from "@/lib/api/enums";
import { useOrg, useSetup } from "@/lib/org";
import { latestScanStats } from "@/lib/scan";
import { useApi } from "@/lib/use-api";

function ConnectionCard({ org, c }: { org: string; c: Connection }) {
  const { data: stats, error } = useApi(() => latestScanStats(org, c.id), [org, c.id]);
  return (
    <div className="card">
      <div className="conn-head">
        <div>
          <h3>
            <Link href={`/connections/${c.id}`}>{c.display_name ?? c.id}</Link>
          </h3>
          <p className="muted">{c.provider}</p>
        </div>
        <Status value={c.status} />
      </div>
      <ErrorNote error={error} />
      {stats === null && <p className="muted empty">No scan results yet.</p>}
      {stats && (
        <div className="conn-body">
          <p className="score">
            <strong>{stats.score ?? "–"}</strong>
            <span>Posture score</span>
          </p>
          <ul className="counts" aria-label="Open findings by severity">
            {SEVERITIES.map((s) => {
              const n = stats.counts_by_severity?.[s] ?? 0;
              return (
                <li key={s} className={n ? undefined : "zero"}>
                  <Severity value={s} />
                  <strong>{n}</strong>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const org = useOrg();
  const { hasPasskey, reloadSession } = useSetup();
  const { data: connections, error } = useApi(
    () => unwrap(api.GET("/orgs/{org}/connections", { params: { path: { org: org.slug } } })),
    [org.slug],
  );
  return (
    <main>
      <h1>Dashboard</h1>
      <SetupChecklist org={org.slug} role={org.role} hasPasskey={hasPasskey} onPasskeyAdded={reloadSession} />
      <ErrorNote error={error} />
      <div className="cards">
        {connections?.map((c) => <ConnectionCard key={c.id} org={org.slug} c={c} />)}
      </div>
      {!!connections?.length && (
        <p className="add-more">
          <Link href="/onboarding/connect-aws">Connect another account</Link>
        </p>
      )}
    </main>
  );
}
