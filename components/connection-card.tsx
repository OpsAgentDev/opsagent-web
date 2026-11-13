"use client";
import Link from "next/link";
import { Severity, Status } from "@/components/badges";
import { ErrorNote } from "@/components/error-note";
import { TopIssues } from "@/components/top-issues";
import type { Connection } from "@/lib/api/client";
import { SEVERITIES } from "@/lib/api/enums";
import { connectionSentence } from "@/lib/connection-status";
import { openTotal, type LatestScan } from "@/lib/scan";

/** One cloud account: status, the latest scan's score and counts, and its top issues. */
export function ConnectionCard({ org, c, several, latest, error }: { org: string; c: Connection; several: boolean; latest?: LatestScan; error?: Error }) {
  // A removed connection's findings are no longer listed, so its last scan's numbers are not shown either.
  const stats = c.status === "disconnected" ? undefined : latest?.stats;
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
      {latest?.lastFailed && <p role="status" className="error">Last scan failed.</p>}
      {latest && !stats && !latest.lastFailed && (
        <p className="muted empty">
          {c.status === "connected" ? "Scanning your account. First results appear in a few minutes." : (connectionSentence(c.status, c.status_reason) ?? "Waiting for verification.")}
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
