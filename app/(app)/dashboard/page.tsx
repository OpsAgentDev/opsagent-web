"use client";
import { OrgLink } from "@/components/org-link";
import { useEffect, useState } from "react";
import { CloudAccounts, loadAccounts } from "@/components/cloud-accounts";
import { ErrorNote } from "@/components/error-note";
import { OverviewTiles } from "@/components/overview-tiles";
import { Skeleton } from "@/components/skeleton";
import { SetupChecklist } from "@/components/setup-checklist";
import { TopIssues } from "@/components/top-issues";
import { TrendChart } from "@/components/trend-chart";
import { useOrg, useSetup } from "@/lib/org";
import { greeting, overview, sinceLast, trendSeries } from "@/lib/scan";
import { isSkipped, setSkipped } from "@/lib/setup-skip";
import { useApi } from "@/lib/use-api";

const when = (at: string) => new Date(at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Dashboard() {
  const org = useOrg();
  const { hasPasskey, reloadSession } = useSetup();
  const { data: rows, error, reload } = useApi(() => loadAccounts(org.slug), [org.slug]);
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
  // First scan: connected but no result yet. Check again every 5 seconds so the findings appear without a refresh.
  const waiting = scanning || (watching > 0 && !last);
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(reload, 5000);
    return () => clearInterval(t);
  }, [waiting, reload]);
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
              <OrgLink href="/findings">All findings</OrgLink>
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
      {!!rows?.length && (
        <>
          <h2>Cloud accounts</h2>
          <CloudAccounts rows={rows} role={org.role} />
        </>
      )}
    </main>
  );
}
