"use client";
import { useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { saveMarketingOk } from "@/lib/marketing-ok";

/** The opt-in to hear about other Binary Labs products; off until ticked, saved on each change. */
export function MarketingOk({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function change(next: boolean) {
    setBusy(true);
    setError(null);
    try {
      setOn(await saveMarketingOk(next));
    } catch (err) {
      setError(err as Error);
    }
    setBusy(false);
  }

  return (
    <section className="card stack">
      <h2>Updates</h2>
      <label className="row">
        <input type="checkbox" checked={on} disabled={busy} onChange={(e) => void change(e.target.checked)} />
        Tell me about other Binary Labs products
      </label>
      <ErrorNote error={error} showCode={false} />
    </section>
  );
}
