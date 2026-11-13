"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ConnectionCard } from "@/components/connection-card";
import { ErrorNote } from "@/components/error-note";
import { OverviewTiles } from "@/components/overview-tiles";
import { SetupChecklist } from "@/components/setup-checklist";
import { api, unwrap } from "@/lib/api/client";
import { useOrg, useSetup } from "@/lib/org";
import { latestScanStats, overview, type LatestScan } from "@/lib/scan";
import { isSkipped, setSkipped } from "@/lib/setup-skip";
import { useApi } from "@/lib/use-api";

type Scan = { latest?: LatestScan; error?: Error };

/** Connections with each one's latest scan; a failed scan read stays on its own card. */
async function loadDashboard(org: string) {
  const connections = await unwrap(api.GET("/orgs/{org}/connections", { params: { path: { org } } }));
  const scans = await Promise.all(
    connections.map((c) => latestScanStats(org, c.id).then((latest): Scan => ({ latest }), (error: Error): Scan => ({ error }))),
  );
  return connections.map((c, i) => ({ c, ...scans[i] }));
}

export default function Dashboard() {
  const org = useOrg();
  const { hasPasskey, reloadSession } = useSetup();
  const { data: rows, error } = useApi(() => loadDashboard(org.slug), [org.slug]);
  const [skipped, setSkippedState] = useState(false);
  useEffect(() => setSkippedState(isSkipped(org.slug)), [org.slug]);
  const toggleSkip = (v: boolean) => { setSkipped(org.slug, v); setSkippedState(v); };
  return (
    <main>
      <h1>Dashboard</h1>
      <OverviewTiles overview={rows ? overview(rows.map((r) => ({ status: r.c.status, stats: r.latest?.stats }))) : null} total={rows?.length ?? 0} />
      <SetupChecklist org={org.slug} role={org.role} hasPasskey={hasPasskey} onPasskeyAdded={reloadSession} skipped={skipped} onSkip={() => toggleSkip(true)} />
      {skipped && rows && !rows.length && (
        <p className="muted empty">
          No cloud account connected yet. <button type="button" className="link" onClick={() => toggleSkip(false)}>Show setup steps</button>
        </p>
      )}
      <ErrorNote error={error} />
      {!!rows?.length && <h2>Cloud accounts</h2>}
      <div className="cards accounts">
        {rows?.map((r) => <ConnectionCard key={r.c.id} org={org.slug} c={r.c} several={rows.length > 1} latest={r.latest} error={r.error} />)}
      </div>
      {!!rows?.length && org.role === "owner" && (
        <p className="add-more">
          <Link href="/onboarding/connect-aws">Connect another account</Link>
        </p>
      )}
    </main>
  );
}
