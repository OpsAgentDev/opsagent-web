"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { forgetChoices } from "@/lib/members";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

type Kind = "org" | "account";

/** Deleting the organisation (owners) and the signed-in person's own account, each behind a typed confirmation. */
export default function AccountSettings() {
  const org = useOrg();
  const { data: me } = useApi(() => unwrap(api.GET("/auth/me")), []);
  const dialog = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState<Kind | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const owner = org.role === "owner";
  const expected = kind === "org" ? org.name : (me?.email ?? "");
  const matches = kind === "org" ? typed === expected : typed.trim().toLowerCase() === expected.toLowerCase();

  function open(k: Kind) {
    setKind(k);
    setTyped("");
    setError(null);
    dialog.current?.showModal();
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      if (kind === "org") {
        await unwrap(api.DELETE("/orgs/{org}", { params: { path: { org: org.slug } } }));
        forgetChoices();
        window.location.assign("/dashboard"); // opens the next organisation, or the welcome screen
      } else {
        await unwrap(api.DELETE("/auth/me", { body: { confirm: typed } }));
        forgetChoices();
        window.location.assign("/");
      }
    } catch (err) {
      setError(err as Error);
      setBusy(false);
    }
  }

  const lastOwner = error instanceof ApiError && error.code === "last_owner";

  return (
    <main className="stack">
      <h1>Account</h1>
      {owner && (
        <section className="card stack">
          <h2>Delete {org.name}</h2>
          <p>
            Checks stop and the subscription is cancelled now. Findings and history are kept for 30 days, then deleted.
            Delete the OpsAgent CloudFormation stack in each AWS account afterwards to remove OpsAgent&apos;s access.
          </p>
          <p><button type="button" className="danger" onClick={() => open("org")}>Delete organisation</button></p>
        </section>
      )}
      <section className="card stack">
        <h2>Delete my account</h2>
        <p>
          You leave every organisation and your sign-in details are erased. If you are the only owner of an organisation,
          make someone else an owner or delete that organisation first.
        </p>
        <p><button type="button" className="danger" onClick={() => open("account")} disabled={!me}>Delete my account</button></p>
      </section>
      <dialog ref={dialog} aria-label={kind === "org" ? "Delete organisation" : "Delete my account"} onClose={() => setKind(null)}>
        <form className="stack" onSubmit={(e) => { e.preventDefault(); if (matches) void confirm(); }}>
          <strong>{kind === "org" ? `Delete ${org.name}?` : "Delete your account?"}</strong>
          <label>
            {kind === "org" ? "Type the organisation's name to confirm" : "Type your email address to confirm"}
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </label>
          <div className="row">
            <button type="submit" className="danger" disabled={!matches || busy}>
              {kind === "org" ? "Delete organisation" : "Delete my account"}
            </button>
            <button type="button" onClick={() => dialog.current?.close()}>Cancel</button>
          </div>
          {kind && <ErrorNote error={error} showCode={false} />}
          {kind === "account" && lastOwner && <p><Link href="/settings/members">Go to Members</Link></p>}
        </form>
      </dialog>
    </main>
  );
}
