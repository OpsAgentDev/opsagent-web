"use client";
import { useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type AuditEntry } from "@/lib/api/client";
import { actionLabel, targetLabel } from "@/lib/audit";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

const PAGE_SIZE = 50;
const when = (t: string) => new Date(t).toLocaleString();

/** The organisation's audit log, newest first, for owners. */
export default function AuditLog() {
  const org = useOrg();
  const owner = org.role === "owner";
  const [more, setMore] = useState<AuditEntry[]>([]);
  const [next, setNext] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [moreError, setMoreError] = useState<Error | null>(null);
  const load = (cursor?: string) =>
    unwrap(api.GET("/orgs/{org}/audit", { params: { path: { org: org.slug }, query: { cursor, limit: PAGE_SIZE } } }));
  const { data: first, error, loading } = useApi(() => (owner ? load() : Promise.resolve(null)), [org.slug, owner]);
  // `next` is undefined until "Load more" has run once; then it is the last loaded page's cursor.
  const cursor = next === undefined ? first?.next_cursor : next;
  const items = [...(first?.items ?? []), ...more];

  async function loadMore() {
    if (!cursor || busy) return;
    setBusy(true);
    try {
      const page = await load(cursor);
      setMore((m) => [...m, ...page.items]);
      setNext(page.next_cursor ?? null);
      setMoreError(null);
    } catch (err) {
      setMoreError(err as Error);
    }
    setBusy(false);
  }

  if (!owner) {
    return (
      <main>
        <h1>Audit log</h1>
        <p className="muted">Only an owner can read the audit log.</p>
      </main>
    );
  }
  return (
    <main>
      <h1>Audit log</h1>
      <p className="muted">What members, agents and OpsAgent did in {org.name}, newest first.</p>
      <ErrorNote error={error ?? moreError} />
      {loading && <p className="muted" role="status">Loading…</p>}
      {first && items.length === 0 && <p className="muted empty">Nothing has been recorded yet.</p>}
      {items.length > 0 && (
        <table className="scroll">
          <thead>
            <tr>
              <th>Time</th>
              <th>Who</th>
              <th>What</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id}>
                <td>{when(e.at)}</td>
                <td>{e.actor}</td>
                <td title={e.action}>{actionLabel(e.action)}</td>
                <td className="muted">{targetLabel(e)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {cursor && <p><button type="button" disabled={busy} onClick={loadMore}>Load more</button></p>}
    </main>
  );
}
