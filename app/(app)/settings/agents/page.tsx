"use client";
import Link from "next/link";
import { useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";
import { agentsScopeNote, kindLabel } from "@/lib/agents";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "Never");

export default function ConnectedAgents() {
  const org = useOrg();
  const { data, error, reload } = useApi(
    () => unwrap(api.GET("/orgs/{org}/agents", { params: { path: { org: org.slug } } })),
    [org.slug],
  );
  const [confirming, setConfirming] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Error | null>(null);
  const note = agentsScopeNote(org.role);

  async function revoke(id: string) {
    try {
      await unwrap(api.DELETE("/orgs/{org}/agents/{id}", { params: { path: { org: org.slug, id } } }));
      setActionError(null);
      setConfirming(null);
      reload();
    } catch (err) {
      setActionError(err as Error);
    }
  }

  return (
    <main>
      <h1>Connected agents</h1>
      {note && <p className="muted">{note}</p>}
      <ErrorNote error={error ?? actionError} />
      {data && data.length === 0 && (
        <p>
          No agents are connected. <Link href="/docs/connect-your-agent">Connect your agent</Link>.
        </p>
      )}
      {data && data.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Kind</th>
              <th>Member</th>
              <th>Created</th>
              <th>Last used</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((a) => (
              <tr key={a.grant_id}>
                <td>{a.client_name}</td>
                <td>{kindLabel(a.client_kind)}</td>
                <td>{a.member_email}</td>
                <td>{when(a.created_at)}</td>
                <td>{when(a.last_used_at)}</td>
                <td>
                  {confirming === a.grant_id ? (
                    <span className="row">
                      Revoke {a.client_name}?
                      <button type="button" onClick={() => revoke(a.grant_id)}>Confirm revoke</button>
                      <button type="button" onClick={() => setConfirming(null)}>Cancel</button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirming(a.grant_id)}>Revoke</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
