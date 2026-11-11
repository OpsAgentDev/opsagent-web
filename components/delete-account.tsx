"use client";
import { useRef, useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";
import { forgetChoices } from "@/lib/members";

/** "Delete my account" behind a typed-email confirmation, for a person with no organisation (brain allows it). */
export function DeleteAccount({ email }: { email: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await unwrap(api.DELETE("/auth/me", { body: { confirm: typed } }));
      forgetChoices();
      window.location.assign("/");
    } catch (err) {
      setError(err as Error);
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="link" onClick={() => { setTyped(""); setError(null); dialog.current?.showModal(); }}>
        Delete my account
      </button>
      <dialog ref={dialog} aria-label="Delete my account">
        <form className="stack" onSubmit={(e) => { e.preventDefault(); if (matches) void confirm(); }}>
          <strong>Delete your account?</strong>
          <label>
            Type your email address to confirm
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </label>
          <div className="row">
            <button type="submit" className="danger" disabled={!matches || busy}>Delete my account</button>
            <button type="button" onClick={() => dialog.current?.close()}>Cancel</button>
          </div>
          <ErrorNote error={error} showCode={false} />
        </form>
      </dialog>
    </>
  );
}
