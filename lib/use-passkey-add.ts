"use client";
import { useState } from "react";
import { log } from "@/lib/log";
import { addPasskey, cancelled } from "@/lib/webauthn";

/** The "Add a passkey" action shared by the dashboard card and the setup checklist. A dismissed prompt is not an error. */
export function usePasskeyAdd(onAdded: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  async function add() {
    setBusy(true);
    setError(null);
    try {
      await addPasskey();
      onAdded();
    } catch (err) {
      log.warn("adding a passkey failed", { name: err instanceof Error ? err.name : undefined });
      if (!cancelled(err)) setError(err as Error);
      setBusy(false);
    }
  }
  return { busy, error, add };
}
