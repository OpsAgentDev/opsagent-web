"use client";
import { useState } from "react";
import { ErrorNote } from "@/components/error-note";

/**
 * One explicit button for a token link (recipient confirm, unsubscribe). Never acts on page load:
 * mail scanners prefetch links.
 */
export function ConfirmAction({ label, done, run }: { label: string; done: string; run: () => Promise<unknown> }) {
  const [state, setState] = useState<{ done?: boolean; busy?: boolean; error?: Error }>({});

  async function act() {
    setState({ busy: true });
    try {
      await run();
      setState({ done: true });
    } catch (err) {
      setState({ error: err as Error });
    }
  }

  if (state.done) return <p role="status">{done}</p>;
  return (
    <div className="stack">
      <button type="button" onClick={act} disabled={state.busy}>
        {label}
      </button>
      <ErrorNote error={state.error} />
    </div>
  );
}
