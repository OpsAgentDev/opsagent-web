"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { consentWarnings, defaultOrg, EXPIRED_MESSAGE, signInUrl, WRONG_BROWSER_MESSAGE } from "@/lib/consent";
import { log } from "@/lib/log";
import { useApi } from "@/lib/use-api";

function Consent() {
  const requestId = useSearchParams().get("request_id") ?? "";
  const path = { params: { path: { request_id: requestId } } };
  const { data: view, error } = useApi(() => unwrap(api.GET("/oauth/consent/{request_id}", path)), [requestId]);
  const [org, setOrg] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<Error | null>(null);
  const status = error instanceof ApiError ? error.status : undefined;

  useEffect(() => {
    if (status === 401) window.location.replace(signInUrl(requestId));
  }, [status, requestId]);
  useEffect(() => {
    if (view) setOrg(defaultOrg(view.organisations));
  }, [view]);

  async function decide(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const deny = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "deny";
    setBusy(true);
    try {
      const { redirect_to } = await unwrap(
        api.POST("/oauth/consent/{request_id}", { ...path, body: deny ? { deny: true } : { organisation: org } }),
      );
      log.info("consent decided", { deny });
      // Not isSameOrigin-checked: this is the client's own redirect URI by design.
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
        <strong>{view.client_name}</strong> wants read access to your OpsAgent findings and connections.
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
      <div className="row">
        <button type="submit" value="approve" disabled={busy || !org}>Approve</button>
        <button type="submit" value="deny" formNoValidate disabled={busy}>Deny</button>
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
