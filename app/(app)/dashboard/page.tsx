"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Severity, Status } from "@/components/badges";
import { ErrorNote } from "@/components/error-note";
import { TopIssues } from "@/components/top-issues";
import { SetupChecklist } from "@/components/setup-checklist";
import { api, unwrap, type Connection } from "@/lib/api/client";
import { SEVERITIES } from "@/lib/api/enums";
import { useOrg, useSetup } from "@/lib/org";
import { latestScanStats, openTotal } from "@/lib/scan";
import { isSkipped, setSkipped } from "@/lib/setup-skip";
import { useApi } from "@/lib/use-api";

function ConnectionCard({ org, c, several }: { org: string; c: Connection; several: boolean }) {
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
      {stats === null && (
        <p className="muted empty">
          {c.status === "connected" ? "Scanning your account. First results appear in a few minutes." : "Waiting for verification."}
        </p>
      )}
      {stats && (
        <>
          <div className="conn-body">
            <p className="score" title="Higher is better">
              <strong>{stats.score ?? "–"}</strong>
              <span>out of 100</span>
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
          <p className="view-all">
            <Link href="/findings">{several ? "View all findings" : `View all ${openTotal(stats) ?? ""} findings`}</Link>
          </p>
          <TopIssues org={org} connection={c.id} />
        </>
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
  const [skipped, setSkippedState] = useState(false);
  useEffect(() => setSkippedState(isSkipped(org.slug)), [org.slug]);
  const toggleSkip = (v: boolean) => { setSkipped(org.slug, v); setSkippedState(v); };
  return (
    <main>
      <h1>Dashboard</h1>
      <SetupChecklist org={org.slug} role={org.role} hasPasskey={hasPasskey} onPasskeyAdded={reloadSession} skipped={skipped} onSkip={() => toggleSkip(true)} />
      {skipped && connections && !connections.length && (
        <p className="muted empty">
          No cloud account connected yet. <button type="button" className="link" onClick={() => toggleSkip(false)}>Show setup steps</button>
        </p>
      )}
      <ErrorNote error={error} />
      <div className="cards">
        {connections?.map((c) => <ConnectionCard key={c.id} org={org.slug} c={c} several={connections.length > 1} />)}
      </div>
      {!!connections?.length && (
        <p className="add-more">
          <Link href="/onboarding/connect-aws">Connect another account</Link>
        </p>
      )}
    </main>
  );
}
