"use client";
import { useRef, useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type Member } from "@/lib/api/client";
import { useApi } from "@/lib/use-api";

type Props = { org: string; owner: boolean; selfId: string };

/** People in the organisation. Owners invite by email and remove others; anyone may leave. Brain enforces all. */
export function Members({ org, owner, selfId }: Props) {
  const path = { params: { path: { org } } };
  const { data, error, reload } = useApi(() => unwrap(api.GET("/orgs/{org}/members", path)), [org]);
  // Pending invites are owner-only in brain; members never ask.
  const invites = useApi(() => (owner ? unwrap(api.GET("/orgs/{org}/invites", path)) : Promise.resolve([])), [org, owner]);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelDialog = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState<Member | null>(null);
  const [cancelling, setCancelling] = useState<{ id: string; email: string } | null>(null);
  const [sentTo, setSentTo] = useState<{ email: string; role: string } | null>(null);
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
      await unwrap(api.POST("/orgs/{org}/invites", { ...path, body }));
      setSentTo(body);
      form.reset();
      invites.reload();
    });
  }

  const leaving = target?.user_id === selfId;

  const remove = () =>
    act(async () => {
      if (!target) return;
      await unwrap(api.DELETE("/orgs/{org}/members/{id}", { params: { path: { org, id: target.id } } }));
      // Leaving: this page is no longer ours; a full load lets the app pick another organisation.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- the org list must reload
      if (target.user_id === selfId) return window.location.assign("/");
      dialog.current?.close();
      reload();
    });

  const changeRole = (m: Member, role: string) =>
    act(async () => {
      try {
        await unwrap(api.PATCH("/orgs/{org}/members/{id}", { params: { path: { org, id: m.id } }, body: { role } }));
      } finally {
        reload(); // on a refusal (last owner) the select snaps back to the stored role
      }
    });

  const cancelInvite = () =>
    act(async () => {
      if (!cancelling) return;
      await unwrap(api.DELETE("/orgs/{org}/invites/{id}", { params: { path: { org, id: cancelling.id } } }));
      cancelDialog.current?.close();
      invites.reload();
    });

  return (
    <section className="stack">
      <ErrorNote error={error} showCode={false} />
      {data && (
        <table className="scroll">
          <thead>
            <tr><th>Person</th><th>Role</th><th /></tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.id}>
                <td>{m.name ? `${m.name} (${m.email})` : m.email}</td>
                <td>
                  {owner && m.user_id !== selfId ? (
                    <select aria-label={`Role for ${m.email}`} value={m.role} disabled={busy}
                      onChange={(e) => changeRole(m, e.target.value)}>
                      <option value="member">Member</option>
                      <option value="owner">Owner</option>
                    </select>
                  ) : (
                    m.role
                  )}
                </td>
                <td className="actions">
                  {(owner || m.user_id === selfId) && (
                    <button type="button" className="danger"
                      aria-label={m.user_id === selfId ? "Leave organisation" : `Remove ${m.email}`}
                      onClick={() => { setTarget(m); setActionError(null); dialog.current?.showModal(); }}>
                      {m.user_id === selfId ? "Leave" : "Remove"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {sentTo && <p role="status">Invite sent to {sentTo.email} as {sentTo.role}.</p>}
      {owner && invites.data && invites.data.length > 0 && (
        <>
          <h2>Pending invites</h2>
          <table className="scroll">
            <thead>
              <tr><th>Email</th><th>Role</th><th>Link works until</th><th /></tr>
            </thead>
            <tbody>
              {invites.data.map((i) => (
                <tr key={i.id}>
                  <td>{i.email}</td>
                  <td>{i.role}</td>
                  <td>{new Date(i.expires_at).toLocaleDateString()}</td>
                  <td className="actions">
                    <button type="button" className="danger" aria-label={`Cancel invite to ${i.email}`}
                      onClick={() => { setCancelling(i); setActionError(null); cancelDialog.current?.showModal(); }}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <ErrorNote error={invites.error} showCode={false} />
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
      {!target && !cancelling && <ErrorNote error={actionError} showCode={false} />}
      <dialog ref={cancelDialog} aria-label="Cancel invite" onClose={() => setCancelling(null)}>
        <div className="stack">
          <strong>Cancel the invite to {cancelling?.email}?</strong>
          <p>The link stops working. You can invite them again later.</p>
          <div className="row">
            <button type="button" className="danger" disabled={busy} onClick={cancelInvite}>Cancel invite</button>
            <button type="button" onClick={() => cancelDialog.current?.close()}>Keep it</button>
          </div>
          {cancelling && <ErrorNote error={actionError} showCode={false} />}
        </div>
      </dialog>
      <dialog ref={dialog} aria-label="Remove member" onClose={() => setTarget(null)}>
        <div className="stack">
          {leaving ? (
            <>
              <strong>Leave this organisation?</strong>
              <p>You lose access straight away. You can rejoin only if an owner invites you again.</p>
            </>
          ) : (
            <>
              <strong>Remove {target?.email}?</strong>
              <p>They lose access to this organisation straight away. They can rejoin only if invited again.</p>
            </>
          )}
          <div className="row">
            <button type="button" className="danger" disabled={busy} onClick={remove}>{leaving ? "Leave" : "Remove"}</button>
            <button type="button" onClick={() => dialog.current?.close()}>Cancel</button>
          </div>
          {target && <ErrorNote error={actionError} showCode={false} />}
        </div>
      </dialog>
    </section>
  );
}
