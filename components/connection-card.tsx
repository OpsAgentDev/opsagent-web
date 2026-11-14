"use client";
import { OrgLink } from "@/components/org-link";
import { Severity, Status } from "@/components/badges";
import { ErrorNote } from "@/components/error-note";
import { ScoreRing } from "@/components/overview-tiles";
import type { Connection } from "@/lib/api/client";
import { SEVERITIES } from "@/lib/api/enums";
import { connectionSentence } from "@/lib/connection-status";
import { openTotal, type LatestScan } from "@/lib/scan";

/** One cloud account: status, then the latest scan's score and counts by severity. */
export function ConnectionCard({ c, several, latest, error }: { c: Connection; several: boolean; latest?: LatestScan; error?: Error }) {
  // A removed connection's findings are no longer listed, so its last scan's numbers are not shown either.
  const stats = c.status === "disconnected" ? undefined : latest?.stats;
  return (
    <div className="card ov-account">
      <div className="ov-account-head">
        <div>
          <h3>
            <OrgLink href={`/connections/${c.id}`}>{c.display_name ?? c.id}</OrgLink>
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
          <div className="ov-account-body">
            <p className="ov-score" title="Posture score, higher is better">
              <ScoreRing score={stats.score} small />
              <span>out of 100</span>
            </p>
            <ul className="ov-counts" aria-label="Open findings by severity">
              {SEVERITIES.map((s) => {
                const n = stats.counts_by_severity?.[s] ?? 0;
                return (
                  <li key={s} className={n ? undefined : "zero"}>
                    <strong>{n}</strong>
                    <Severity value={s} />
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="ov-bar" aria-hidden="true">
            {SEVERITIES.map((s) => (stats.counts_by_severity?.[s] ? <span key={s} className={`sev-${s}`} style={{ flexGrow: stats.counts_by_severity[s] }} /> : null))}
          </div>
          <p className="ov-account-foot">
            <OrgLink href="/findings">{several ? "View all findings" : `View all ${openTotal(stats) ?? ""} findings`}</OrgLink>
          </p>
        </>
      )}
    </div>
  );
}
