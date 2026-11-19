"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { hasWrite, ownsOrg } from "@/lib/agents";
import { api, ApiError, unwrap } from "@/lib/api/client";
import {
  consentWarnings,
  defaultOrg,
  EXPIRED_MESSAGE,
  safeClientRedirect,
  signInUrl,
  WRONG_BROWSER_MESSAGE,
} from "@/lib/consent";
import { log } from "@/lib/log";
import { useApi } from "@/lib/use-api";

function Consent() {
  const requestId = useSearchParams().get("request_id") ?? "";
  const path = { params: { path: { request_id: requestId } } };
  const { data: view, error } = useApi(() => unwrap(api.GET("/oauth/consent/{request_id}", path)), [requestId]);
  const [org, setOrg] = useState("");
  const [changes, setChanges] = useState<boolean | null>(null); // null: not touched, follow what the client asked for
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<Error | null>(null);
  const status = error instanceof ApiError ? error.status : undefined;

  useEffect(() => {
    if (status === 401) window.location.replace(signInUrl(requestId));
  }, [status, requestId]);
  useEffect(() => {
    if (view) setOrg(defaultOrg(view.organisations));
  }, [view]);

  const owner = ownsOrg(view?.organisations.find((o) => o.slug === org));
  const allow = owner && (changes ?? hasWrite(view?.scopes));

  async function decide(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const deny = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "deny";
    setBusy(true);
    try {
      const { redirect_to } = await unwrap(
        api.POST("/oauth/consent/{request_id}", { ...path, body: deny ? { deny: true } : { organisation: org, allow_changes: allow } }),
      );
      log.info("consent decided", { deny });
      // Not isSameOrigin-checked: this is the client's own redirect URI by design.
      if (!safeClientRedirect(redirect_to)) throw new Error("The agent's redirect address is not allowed.");
      window.location.assign(redirect_to);
    } catch (err) {
      setActionError(err as Error);
      setBusy(false);
    }
  }

  if (!requestId) return <p className="error">This request is incomplete. Start the connection again from your AI tool.</p>;
  if (status === 401) return <p className="muted" role="status">Loading…</p>;
  if (status === 410) return <p role="alert" className="error">{EXPIRED_MESSAGE}</p>;
  if (error instanceof ApiError && error.code === "consent_wrong_browser") {
    return <p role="alert" className="error">{WRONG_BROWSER_MESSAGE}</p>;
  }
  if (error && !view) return <ErrorNote error={error} />;
  if (!view) return <p className="muted" role="status">Loading…</p>;

  return (
    <form className="stack" onSubmit={decide}>
      <p>
        <strong>{view.client_name}</strong> wants access to your OpsAgent findings and connections.
      </p>
      <p>
        It will be sent to <code data-testid="redirect-uri">{view.redirect_uri}</code>
      </p>
      {consentWarnings(view).map((w) => (
        <p key={w} className="error" role="note">{w}</p>
      ))}
      <label>
        Organisation
        <select value={org} onChange={(e) => setOrg(e.target.value)} required>
          <option value="" disabled>Choose an organisation</option>
          {view.organisations.map((o) => (
            <option key={o.slug} value={o.slug}>{o.name}</option>
          ))}
        </select>
      </label>
      {view.organisations.length === 0 && <p className="muted">You have no organisation yet. Create one first.</p>}
      {owner && (
        <div>
          <label className="row">
            <input type="checkbox" checked={allow} onChange={(e) => setChanges(e.target.checked)} aria-describedby="changes-note" />
            Let this agent make changes
          </label>
          <p id="changes-note" className="muted">
            It can accept, snooze and reopen findings, and connect cloud accounts. It cannot change the cloud accounts
            themselves, billing, members or delivery.
          </p>
        </div>
      )}
      <div className="row">
        <button type="submit" value="approve" disabled={busy || !org}>{allow ? "Approve read and changes" : "Approve"}</button>
        <button type="submit" className="secondary" value="deny" formNoValidate disabled={busy}>Deny</button>
      </div>
      <ErrorNote error={actionError} />
    </form>
  );
}

export default function ConsentPage() {
  return (
    <main>
      <h1>Connect an AI agent</h1>
      <Suspense>
        <Consent />
      </Suspense>
    </main>
  );
}
