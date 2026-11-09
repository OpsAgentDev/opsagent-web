"use client";
import { useRef, useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";

type Props = { org: string; id: string; name: string; onRemoved: (nextStep: string) => void };

/** Owner action: stops checks on this account after a confirmation. */
export function RemoveConnection({ org, id, name, onRemoved }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const done = await unwrap(api.DELETE("/orgs/{org}/connections/{id}", { params: { path: { org, id } } }));
      ref.current?.close();
      onRemoved(done.next_step);
    } catch (err) {
      setError(err as Error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p>
        <button type="button" className="danger" onClick={() => ref.current?.showModal()}>
          Remove connection
        </button>
      </p>
      <dialog ref={ref} aria-label="Remove connection">
        <div className="stack">
          <strong>Remove {name}?</strong>
          <p>OpsAgent stops checking this account. If it is on your plan, it stays billed until the current period ends.</p>
          <div className="row">
            <button type="button" className="danger" disabled={busy} onClick={remove}>
              Remove
            </button>
            <button type="button" onClick={() => ref.current?.close()}>
              Cancel
            </button>
          </div>
          <ErrorNote error={error} />
        </div>
      </dialog>
    </>
  );
}
