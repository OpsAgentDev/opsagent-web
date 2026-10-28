"use client";
import { useContext, useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";
import { SessionReloadContext } from "@/lib/org";
import { useApi } from "@/lib/use-api";
import { addPasskey, cancelled, supported } from "@/lib/webauthn";

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "Never");

export default function Security() {
  const reloadSession = useContext(SessionReloadContext);
  const { data, error, reload } = useApi(() => unwrap(api.GET("/auth/passkeys")), []);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<Error | null>(null);

  async function act(action: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      reload();
      reloadSession(); // has_passkey drives the recommendation card
    } catch (err) {
      if (!cancelled(err)) setActionError(err as Error);
    }
    setBusy(false);
  }

  const remove = (id: string) => act(() => unwrap(api.DELETE("/auth/passkeys/{id}", { params: { path: { id } } })));

  return (
    <main>
      <h1>Security</h1>
      <h2>Passkeys</h2>
      <p className="muted">Sign in with your fingerprint, face or device PIN instead of an emailed code.</p>
      <ErrorNote error={error ?? actionError} />
      {data && data.length === 0 && <p>No passkeys yet.</p>}
      {data && data.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Added</th>
              <th>Last used</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{when(p.created_at)}</td>
                <td>{when(p.last_used_at)}</td>
                <td>
                  <button type="button" disabled={busy} onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p>
        {supported() ? (
          <button type="button" className="primary" disabled={busy} onClick={() => act(addPasskey)}>Add a passkey</button>
        ) : (
          <span className="muted">This browser can&apos;t create passkeys.</span>
        )}
      </p>
    </main>
  );
}
