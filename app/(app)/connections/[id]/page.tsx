"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type Connection } from "@/lib/api/client";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

const SETTLING = new Set(["pending", "verifying"]);
const SCANNABLE = new Set(["connected", "degraded"]);

function LastVerification({ v }: { v: NonNullable<Connection["last_verification"]> }) {
  return (
    <section>
      <h2>Last verification</h2>
      <p>
        {v.outcome} at {new Date(v.at).toLocaleString()}
      </p>
      {v.missing_grants.length > 0 && <p>Missing permissions: {v.missing_grants.join(", ")}</p>}
      {v.extra_grants.length > 0 && <p>Permissions beyond the template: {v.extra_grants.join(", ")}</p>}
    </section>
  );
}

export default function ConnectionPage() {
  const org = useOrg();
  const { id } = useParams<{ id: string }>();
  const { data: c, error, reload } = useApi(
    () => unwrap(api.GET("/orgs/{org}/connections/{id}", { params: { path: { org: org.slug, id } } })),
    [org.slug, id],
  );
  const [scan, setScan] = useState<{ started?: boolean; error?: Error }>({});

  const settling = !!c && SETTLING.has(c.status);
  useEffect(() => {
    if (!settling) return;
    const t = setInterval(reload, 2000);
    return () => clearInterval(t);
  }, [settling, reload]);

  async function scanNow() {
    try {
      await unwrap(api.POST("/orgs/{org}/connections/{id}/scan", { params: { path: { org: org.slug, id } } }));
      setScan({ started: true });
    } catch (err) {
      setScan({ error: err as Error });
    }
  }

  if (!c) return <main>{error ? <ErrorNote error={error} /> : <p className="muted">Loading…</p>}</main>;
  return (
    <main>
      <h1>{c.display_name ?? c.id}</h1>
      <dl>
        <dt>Status</dt>
        <dd data-testid="connection-status">{c.status}</dd>
        {c.status_reason && (
          <>
            <dt>Reason</dt>
            <dd>{c.status_reason}</dd>
          </>
        )}
        <dt>Account</dt>
        <dd>{c.external_account_id ?? "–"}</dd>
        <dt>Nightly scan</dt>
        <dd>{c.scan_time_local ?? "default"}</dd>
        <dt>Briefing</dt>
        <dd>{c.briefing_time_local ?? "default"}</dd>
      </dl>
      {c.last_verification && <LastVerification v={c.last_verification} />}
      <div className="row">
        <button type="button" onClick={scanNow} disabled={!SCANNABLE.has(c.status)}>
          Scan now
        </button>
        {scan.started && <span>Scan started. Findings appear as checks finish.</span>}
        <Link href={`/connections/${c.id}/briefing`}>Preview briefing</Link>
      </div>
      <ErrorNote error={scan.error ?? error} />
    </main>
  );
}
