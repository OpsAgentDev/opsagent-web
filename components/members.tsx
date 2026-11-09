"use client";
import { useRef, useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type Member } from "@/lib/api/client";
import { useApi } from "@/lib/use-api";

type Sent = { id: string; email: string; role: string; expires_at: string };
type Props = { org: string; owner: boolean; selfId: string };

/** People in the organisation. Owners invite by email and remove others; brain enforces both. */
export function Members({ org, owner, selfId }: Props) {
  const path = { params: { path: { org } } };
  const { data, error, reload } = useApi(() => unwrap(api.GET("/orgs/{org}/members", path)), [org]);
  const dialog = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState<Member | null>(null);
  const [sent, setSent] = useState<Sent[]>([]); // brain has no list of pending invites; show this visit's
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<Error | null>(null);

  async function act(call: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await call();
    } catch (err) {
      setActionError(err as Error);
    } finally {
      setBusy(false);
    }
  }

  function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    return act(async () => {
      const body = { email: String(f.get("email") ?? "").trim(), role: String(f.get("role") ?? "member") };
      const row = await unwrap(api.POST("/orgs/{org}/invites", { ...path, body }));
      setSent((s) => [row, ...s]);
      form.reset();
    });
  }

  const remove = () =>
    act(async () => {
      if (!target) return;
      await unwrap(api.DELETE("/orgs/{org}/members/{id}", { params: { path: { org, id: target.id } } }));
      dialog.current?.close();
      reload();
    });

  return (
    <section className="stack">
      <ErrorNote error={error} />
      {data && (
        <table className="scroll">
          <thead>
            <tr><th>Person</th><th>Role</th><th /></tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.id}>
                <td>{m.name ? `${m.name} (${m.email})` : m.email}</td>
                <td>{m.role}</td>
                <td className="actions">
                  {owner && m.user_id !== selfId && (
                    <button type="button" className="danger" aria-label={`Remove ${m.email}`}
                      onClick={() => { setTarget(m); setActionError(null); dialog.current?.showModal(); }}>
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {sent.map((s) => (
        <p key={s.id} role="status">
          Invite sent to {s.email} as {s.role}. The link works until {new Date(s.expires_at).toLocaleDateString()}.
        </p>
      ))}
      {owner && (
        <form className="row" onSubmit={invite}>
          <label>
            Email
            <input name="email" type="email" required autoComplete="off" />
          </label>
          <label>
            Role
            <select name="role" defaultValue="member">
              <option value="member">Member</option>
              <option value="owner">Owner</option>
            </select>
          </label>
          <button type="submit" disabled={busy}>Send invite</button>
        </form>
      )}
      {!target && <ErrorNote error={actionError} />}
      <dialog ref={dialog} aria-label="Remove member" onClose={() => setTarget(null)}>
        <div className="stack">
          <strong>Remove {target?.email}?</strong>
          <p>They lose access to this organisation straight away. They can rejoin only if invited again.</p>
          <div className="row">
            <button type="button" className="danger" disabled={busy} onClick={remove}>Remove</button>
            <button type="button" onClick={() => dialog.current?.close()}>Cancel</button>
          </div>
          <ErrorNote error={actionError} />
        </div>
      </dialog>
    </section>
  );
}
