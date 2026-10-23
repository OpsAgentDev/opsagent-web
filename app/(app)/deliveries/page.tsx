"use client";
import { useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { Pager, useCursors } from "@/components/pager";
import { api, unwrap } from "@/lib/api/client";
import { DELIVERY_KINDS } from "@/lib/api/enums";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

const PAGE_SIZE = 50;
const when = (t?: string | null) => (t ? new Date(t).toLocaleString() : "–");

export default function Deliveries() {
  const org = useOrg();
  const [connection, setConnection] = useState("");
  const [kind, setKind] = useState("");
  const pager = useCursors();
  const { cursor } = pager;

  const connections = useApi(
    () => unwrap(api.GET("/orgs/{org}/connections", { params: { path: { org: org.slug } } })),
    [org.slug],
  );
  const { data: page, error, loading } = useApi(() => {
    const query = { connection: connection || undefined, kind: kind || undefined, cursor, limit: PAGE_SIZE };
    return unwrap(api.GET("/orgs/{org}/deliveries", { params: { path: { org: org.slug }, query } }));
  }, [org.slug, connection, kind, cursor]);

  const filter = (set: (v: string) => void) => (v: string) => {
    set(v);
    pager.reset();
  };
  const names = new Map(connections.data?.map((c) => [c.id, c.display_name ?? c.id]));

  return (
    <main>
      <h1>Deliveries</h1>
      <div className="row">
        <label>
          Connection
          <select value={connection} onChange={(e) => filter(setConnection)(e.target.value)}>
            <option value="">all</option>
            {connections.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name ?? c.id}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kind
          <select value={kind} onChange={(e) => filter(setKind)(e.target.value)}>
            <option value="">all</option>
            {DELIVERY_KINDS.map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
      </div>
      <ErrorNote error={error ?? connections.error} />
      {loading && <p className="muted" role="status">Loading…</p>}
      <table>
        <thead>
          <tr>
            <th>Created</th>
            <th>Kind</th>
            <th>Connection</th>
            <th>Channel</th>
            <th>Status</th>
            <th>Attempts</th>
            <th>Sent</th>
          </tr>
        </thead>
        <tbody>
          {page?.items.map((d) => (
            <tr key={d.id}>
              <td>{when(d.created_at)}</td>
              <td>{d.kind}</td>
              <td className="muted">{d.connection_id ? (names.get(d.connection_id) ?? d.connection_id) : "organisation"}</td>
              <td>{d.channel}</td>
              <td>{d.status}</td>
              <td>{d.attempts}</td>
              <td>{when(d.sent_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {page?.items.length === 0 && <p className="muted">No deliveries yet.</p>}
      <Pager pager={pager} next={page?.next_cursor} />
    </main>
  );
}
