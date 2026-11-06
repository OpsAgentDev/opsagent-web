"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ConnectionActions, ConnectionFacts, ConnectionHeader } from "@/components/connection-status";
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
      <ConnectionHeader c={c} />
      <ConnectionFacts c={c} />
      {c.last_verification && <LastVerification v={c.last_verification} />}
      <ConnectionActions c={c} canScan={SCANNABLE.has(c.status)} onScan={scanNow} started={!!scan.started} />
      <ErrorNote error={scan.error ?? error} />
    </main>
  );
}
