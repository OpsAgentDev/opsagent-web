"use client";
import { useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, ApiError, unwrap, type Connection, type HumanReviews } from "@/lib/api/client";

const price = (cents: number) => `$${(cents / 100).toLocaleString("en-US")}`;
const CONFIRM = "Harun will reply within 1 business day with a confirmation and invoice. Nothing is changed in your account.";

function ReviewForm({ org, connections, onSent }: { org: string; connections: Connection[]; onSent: () => void }) {
  const [connection, setConnection] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [limited, setLimited] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSent(false);
    setLimited(false);
    try {
      const body = { kind: "account", connection_id: connection || connections[0]?.id, note: note.trim() || null };
      await unwrap(api.POST("/orgs/{org}/human-reviews", { params: { path: { org } }, body }));
      setSent(true);
      setNote("");
      onSent();
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setLimited(true);
      else setError(err as Error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      <h3>Request an account review</h3>
      {connections.length === 0 ? (
        <p className="muted">Connect a cloud account first.</p>
      ) : (
        <>
          <label>
            Cloud account
            <select value={connection || connections[0]?.id} onChange={(e) => setConnection(e.target.value)}>
              {connections.map((c) => <option key={c.id} value={c.id}>{c.display_name ?? c.id}</option>)}
            </select>
          </label>
          <label>
            Note
            <textarea rows={4} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <button type="submit" className="fit" disabled={busy}>Request review</button>
        </>
      )}
      <ErrorNote error={error} />
      {limited && <p role="alert" className="error">You&apos;ve sent 5 requests today. Try again tomorrow.</p>}
      {sent && <p role="status">Request sent. Harun will reply within 1 business day.</p>}
    </form>
  );
}

export function HumanReviewView(p: {
  org: string;
  owner: boolean;
  data: HumanReviews;
  connections: Connection[];
  onSent: () => void;
}) {
  const title = (kind: string) => p.data.offers.find((o) => o.kind === kind)?.title ?? kind;
  return (
    <>
      <div className="cards">
        {p.data.offers.map((o) => (
          <article key={o.kind} className="card stack">
            <h3>{o.title}</h3>
            <p className="price">{price(o.price_cents)}</p>
            <p>{o.description}</p>
            <p className="muted">{CONFIRM}</p>
          </article>
        ))}
      </div>
      {p.owner ? (
        <ReviewForm org={p.org} connections={p.connections} onSent={p.onSent} />
      ) : (
        <p className="muted">Only owners can request a review.</p>
      )}
      <h2>Your requests</h2>
      {p.data.requests.length === 0 ? (
        <p className="muted">No requests yet.</p>
      ) : (
        <table>
          <thead><tr><th>Date</th><th>Product</th><th>Target</th><th>Price</th></tr></thead>
          <tbody>
            {p.data.requests.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>{title(r.kind)}</td>
                <td>{r.target_label}</td>
                <td>{price(r.price_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
