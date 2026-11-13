"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ConnectionCard } from "@/components/connection-card";
import { ErrorNote } from "@/components/error-note";
import { OverviewTiles } from "@/components/overview-tiles";
import { Skeleton } from "@/components/skeleton";
import { SetupChecklist } from "@/components/setup-checklist";
import { TopIssues } from "@/components/top-issues";
import { TrendChart } from "@/components/trend-chart";
import { api, unwrap } from "@/lib/api/client";
import { useOrg, useSetup } from "@/lib/org";
import { greeting, overview, scanHistory, sinceLast, trendSeries, type ScanHistory } from "@/lib/scan";
import { isSkipped, setSkipped } from "@/lib/setup-skip";
import { useApi } from "@/lib/use-api";

type Scans = { history?: ScanHistory; error?: Error };

/** Connections with each one's finished scans; a failed scan read stays on its own card. */
async function loadDashboard(org: string) {
  const connections = await unwrap(api.GET("/orgs/{org}/connections", { params: { path: { org } } }));
  const scans = await Promise.all(
    connections.map((c) => scanHistory(org, c.id).then((history): Scans => ({ history }), (error: Error): Scans => ({ error }))),
  );
  return connections.map((c, i) => ({ c, ...scans[i] }));
}

const when = (at: string) => new Date(at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Dashboard() {
  const org = useOrg();
  const { hasPasskey, reloadSession } = useSetup();
  const { data: rows, error } = useApi(() => loadDashboard(org.slug), [org.slug]);
  const [skipped, setSkippedState] = useState(false);
  useEffect(() => setSkippedState(isSkipped(org.slug)), [org.slug]);
  const toggleSkip = (v: boolean) => { setSkipped(org.slug, v); setSkippedState(v); };

  const live = rows?.filter((r) => r.c.status !== "disconnected") ?? [];
  const points = trendSeries(live.flatMap((r) => (r.history ? [r.history.scans] : [])));
  const since = sinceLast(points);
  const last = points.at(-1);
  // The line under the greeting says only what is known.
  const line = !rows ? null
    : last ? `Last scan ${when(last.at)}.${since?.newCritical ? ` ${since.newCritical} new critical since the previous scan.` : ""}`
    : !rows.length ? "Connect a cloud account to see your first findings."
    : live.some((r) => r.c.status === "connected") ? "Your first scan is running. Results appear here in a few minutes."
    : null;
  const watching = live.filter((r) => r.c.status === "connected").length;
  const scanning = live.some((r) => r.history?.running);
  return (
    <main>
      <header className="ov-greet">
        <h1 className="ov-hello">{greeting(new Date().getHours())}</h1>
        {watching > 0 && (
          <p className="ov-live" data-state={scanning ? "scanning" : "watching"}>
            <i aria-hidden="true" />
            {scanning ? "Scanning now" : `Watching ${watching} ${watching === 1 ? "account" : "accounts"}`}
          </p>
        )}
        {line && <p className="ov-line">{line}</p>}
      </header>
      <OverviewTiles overview={rows ? overview(rows.map((r) => ({ status: r.c.status, stats: r.history?.stats }))) : null} total={rows?.length ?? 0} since={since} />
      {!rows && !error && <Skeleton count={1} />}
      {last && (
        <div className="ov-two">
          <TrendChart points={points} />
          <section className="ov-panel" aria-labelledby="fix-first-title">
            <div className="ov-head">
              <h2 className="ov-title" id="fix-first-title">Fix these first</h2>
              <Link href="/findings">All findings</Link>
            </div>
            <TopIssues org={org.slug} limit={5} label="Fix these first" />
          </section>
        </div>
      )}
      <SetupChecklist org={org.slug} role={org.role} hasPasskey={hasPasskey} onPasskeyAdded={reloadSession} skipped={skipped} onSkip={() => toggleSkip(true)} />
      {skipped && rows && !rows.length && (
        <p className="muted empty">
          No cloud account connected yet. <button type="button" className="link" onClick={() => toggleSkip(false)}>Show setup steps</button>
        </p>
      )}
      <ErrorNote error={error} />
      {!!rows?.length && <h2>Cloud accounts</h2>}
      <div className="cards accounts">
        {rows?.map((r) => <ConnectionCard key={r.c.id} c={r.c} several={rows.length > 1} latest={r.history} error={r.error} />)}
      </div>
      {!!rows?.length && org.role === "owner" && (
        <p className="add-more">
          <Link href="/onboarding/connect-aws">Connect another account</Link>
        </p>
      )}
    </main>
  );
}
