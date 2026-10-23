"use client";
import { useState } from "react";

/** Cursor paging: the stack of cursors up to the current page; reset it when filters change. */
export function useCursors() {
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const reset = () => setCursors([undefined]);
  /** Wrap a filter setter so changing it returns to the first page. */
  const filter = (set: (v: string) => void) => (v: string) => {
    set(v);
    reset();
  };
  return { cursor: cursors[cursors.length - 1], cursors, setCursors, reset, filter };
}

export function Pager({ pager, next }: { pager: ReturnType<typeof useCursors>; next?: string | null }) {
  return (
    <div className="row">
      <button type="button" disabled={pager.cursors.length < 2} onClick={() => pager.setCursors((c) => c.slice(0, -1))}>
        Previous
      </button>
      <button type="button" disabled={!next} onClick={() => pager.setCursors((c) => [...c, next ?? undefined])}>
        Next
      </button>
    </div>
  );
}
