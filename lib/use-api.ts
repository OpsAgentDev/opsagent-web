"use client";
import { useCallback, useEffect, useState } from "react";

/** Runs `load` when `deps` change; `reload()` runs it again. The one data-loading hook. */
export function useApi<T>(load: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: Error; loading: boolean }>({ loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    // A failed reload keeps the last good data; the caller shows the error beside it.
    load().then(
      (data) => live && setState({ data, loading: false }),
      (error: Error) => live && setState((s) => ({ data: s.data, error, loading: false })),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass the inputs of `load`.
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
