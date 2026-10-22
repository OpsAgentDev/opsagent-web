"use client";
import { useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { FindingActionDialog, type FindingAction } from "@/components/finding-action-dialog";
import { api, unwrap, type FindingSummary } from "@/lib/api/client";
import { SEVERITIES, STATUSES } from "@/lib/api/enums";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

const PAGE_SIZE = 50;

export default function Findings() {
  const org = useOrg();
  const [status, setStatus] = useState("open");
  const [severity, setSeverity] = useState("");
  // Cursors of the pages before the current one; the last entry is the current page's cursor.
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const [acting, setActing] = useState<{ finding: FindingSummary; action: FindingAction } | null>(null);
  const [actionError, setActionError] = useState<Error | null>(null);
  const cursor = cursors[cursors.length - 1];

  const { data: page, error, loading, reload } = useApi(() => {
    const query = { status: status || undefined, severity: severity || undefined, cursor, limit: PAGE_SIZE };
    return unwrap(api.GET("/orgs/{org}/findings", { params: { path: { org: org.slug }, query } }));
  }, [org.slug, status, severity, cursor]);

  const filter = (set: (v: string) => void) => (v: string) => {
    set(v);
    setCursors([undefined]);
  };

  async function reopen(f: FindingSummary) {
    try {
      await unwrap(api.POST("/orgs/{org}/findings/{id}/reopen", { params: { path: { org: org.slug, id: f.id } } }));
      setActionError(null);
      reload();
    } catch (err) {
      setActionError(err as Error);
    }
  }

  return (
    <main>
      <h1>Findings</h1>
      <div className="row">
        <label>
          Status
          <select value={status} onChange={(e) => filter(setStatus)(e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
            <option value="">all</option>
          </select>
        </label>
        <label>
          Severity
          <select value={severity} onChange={(e) => filter(setSeverity)(e.target.value)}>
            <option value="">all</option>
            {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <ErrorNote error={error ?? actionError} />
      {loading && <p className="muted" role="status">Loading…</p>}
      <table>
        <thead>
          <tr>
            <th>Severity</th>
            <th>Finding</th>
            <th>Resource</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {page?.items.map((f) => (
            <tr key={f.id} data-id={f.id}>
              <td>{f.severity}</td>
              <td>{f.title}</td>
              <td className="muted">{f.resource_identity}</td>
              <td>{f.status}</td>
              <td className="row">
                {f.status === "open" || f.status === "flapping" ? (
                  <>
                    <button type="button" onClick={() => setActing({ finding: f, action: "snooze" })}>Snooze</button>
                    <button type="button" onClick={() => setActing({ finding: f, action: "accept" })}>Accept</button>
                  </>
                ) : f.status !== "resolved" ? (
                  <button type="button" onClick={() => reopen(f)}>Reopen</button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {page?.items.length === 0 && <p className="muted">Nothing here.</p>}
      <div className="row">
        <button type="button" disabled={cursors.length < 2} onClick={() => setCursors((c) => c.slice(0, -1))}>
          Previous
        </button>
        <button
          type="button"
          disabled={!page?.next_cursor}
          onClick={() => setCursors((c) => [...c, page?.next_cursor ?? undefined])}
        >
          Next
        </button>
      </div>
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
