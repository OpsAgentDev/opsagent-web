"use client";
import { useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type Connection, type Member, type Recipient } from "@/lib/api/client";
import { liveRecipients, newRecipientBody } from "@/lib/delivery";
import { useApi } from "@/lib/use-api";

type Props = { org: string; connections: Connection[]; members: Member[] };

/** Email recipients, organisation-wide or per connection. Invited addresses confirm by mail first. */
export function Recipients({ org, connections, members }: Props) {
  const [by, setBy] = useState("email");
  const [actionError, setActionError] = useState<Error | null>(null);
  // shortcut: first 200 recipients only; page through `next_cursor` when an org has more.
  const { data, error, reload } = useApi(
    () => unwrap(api.GET("/orgs/{org}/recipients", { params: { path: { org }, query: { limit: 200 } } })),
    [org],
  );
  const names = new Map(connections.map((c) => [c.id, c.display_name ?? c.id]));
  const scope = (r: Recipient) => (r.connection_id ? (names.get(r.connection_id) ?? r.connection_id) : "All connections");

  async function act(call: () => Promise<unknown>) {
    try {
      await call();
      setActionError(null);
      reload();
    } catch (err) {
      setActionError(err as Error);
    }
  }

  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const body = newRecipientBody({
      by,
      email: String(f.get("email") ?? ""),
      member_id: String(f.get("member_id") ?? ""),
      connection_id: String(f.get("connection_id") ?? ""),
    });
    return act(async () => {
      await unwrap(api.POST("/orgs/{org}/recipients", { params: { path: { org } }, body }));
      form.reset();
    });
  }

  return (
    <section>
      <h2>Recipients</h2>
      <ErrorNote error={error ?? actionError} />
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Deliveries for</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {liveRecipients(data?.items ?? []).map((r) => (
            <tr key={r.id}>
              <td>{r.email}</td>
              <td>{scope(r)}</td>
              <td>{r.member_id ? "member" : r.status}</td>
              <td>
                <button
                  type="button"
                  aria-label={`Remove ${r.email}`}
                  onClick={() => act(() => unwrap(api.DELETE("/orgs/{org}/recipients/{id}", { params: { path: { org, id: r.id } } })))}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data && liveRecipients(data.items).length === 0 && <p className="muted">No recipients. Owners get every mail.</p>}
      <form className="stack" onSubmit={add}>
        <h3>Add a recipient</h3>
        <fieldset className="row">
          <legend>Add by</legend>
          <label className="row">
            <input type="radio" name="by" value="email" checked={by === "email"} onChange={() => setBy("email")} /> Email
            (confirms by mail)
          </label>
          <label className="row">
            <input type="radio" name="by" value="member" checked={by === "member"} onChange={() => setBy("member")} />{" "}
            Member
          </label>
        </fieldset>
        {by === "email" ? (
          <label>
            Recipient email
            <input name="email" type="email" required />
          </label>
        ) : (
          <label>
            Member
            <select name="member_id" required>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ? `${m.name} (${m.email})` : m.email}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Deliveries for
          <select name="connection_id">
            <option value="">All connections</option>
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name ?? c.id}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Add recipient</button>
      </form>
    </section>
  );
}
