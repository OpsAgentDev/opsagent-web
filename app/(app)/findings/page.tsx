"use client";
import Link from "next/link";
import { useState } from "react";
import { Severity, Status } from "@/components/badges";
import { ErrorNote } from "@/components/error-note";
import { Pager, useCursors } from "@/components/pager";
import { FindingActionDialog, type FindingAction } from "@/components/finding-action-dialog";
import { api, unwrap, type FindingSummary } from "@/lib/api/client";
import { SEVERITIES, STATUSES } from "@/lib/api/enums";
import { findingsSummary } from "@/lib/findings";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

const PAGE_SIZE = 50;

export default function Findings() {
  const org = useOrg();
  const [status, setStatus] = useState("open");
  const [severity, setSeverity] = useState("");
  const pager = useCursors();
  const [acting, setActing] = useState<{ finding: FindingSummary; action: FindingAction } | null>(null);
  const [actionError, setActionError] = useState<Error | null>(null);
  const { cursor } = pager;

  const { data: page, error, loading, reload } = useApi(() => {
    const query = { status: status || undefined, severity: severity || undefined, cursor, limit: PAGE_SIZE };
    return unwrap(api.GET("/orgs/{org}/findings", { params: { path: { org: org.slug }, query } }));
  }, [org.slug, status, severity, cursor]);

  async function reopen(f: FindingSummary) {
    try {
      await unwrap(api.POST("/orgs/{org}/findings/{id}/reopen", { params: { path: { org: org.slug, id: f.id } } }));
      setActionError(null);
      reload();
    } catch (err) {
      setActionError(err as Error);
    }
  }

  const summary = page && findingsSummary(page.items, { more: !!page.next_cursor || pager.cursors.length > 1, status });
  const showStatus = status !== "open"; // every row would say "open"

  return (
    <main>
      <h1>Findings</h1>
      <div className="row">
        <label>
          Status
          <select value={status} onChange={(e) => pager.filter(setStatus)(e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
            <option value="">all</option>
          </select>
        </label>
        <label>
          Severity
          <select value={severity} onChange={(e) => pager.filter(setSeverity)(e.target.value)}>
            <option value="">all</option>
            {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <ErrorNote error={error ?? actionError} />
      {loading && <p className="muted" role="status">Loading…</p>}
      {summary && <p className="summary" data-testid="findings-summary">{summary}</p>}
      <table className="findings">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Finding</th>
            <th>Resource</th>
            {showStatus && <th>Status</th>}
            <th />
          </tr>
        </thead>
        <tbody>
          {page?.items.map((f) => (
            <tr key={f.id} data-id={f.id}>
              <td className="c-sev"><Severity value={f.severity} /></td>
              <td className="c-title"><Link href={`/findings/${f.id}`}>{f.title}</Link></td>
              <td className="c-res muted mono">{f.resource_identity}</td>
              {showStatus && <td className="c-status"><Status value={f.status} /></td>}
              <td className="c-actions actions">
                {f.status === "open" || f.status === "flapping" ? (
                  <>
                    <button type="button" className="quiet" title="Hide this finding until a date you pick (7 days by default)" onClick={() => setActing({ finding: f, action: "snooze" })}>Snooze</button>
                    <button type="button" className="quiet" title="Mark as an accepted risk" onClick={() => setActing({ finding: f, action: "accept" })}>Accept</button>
                  </>
                ) : f.status !== "resolved" ? (
                  <button type="button" className="quiet" onClick={() => reopen(f)}>Reopen</button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {page?.items.length === 0 && <p className="muted empty">Nothing here.</p>}
      <Pager pager={pager} next={page?.next_cursor} />
      {acting && (
        <FindingActionDialog
          org={org.slug}
          {...acting}
          onClose={(changed) => {
            setActing(null);
            if (changed) {
              setActionError(null);
              reload();
            }
          }}
        />
      )}
    </main>
  );
}
