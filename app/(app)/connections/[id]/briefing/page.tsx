"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

export default function BriefingPreview() {
  const org = useOrg();
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useApi(
    () =>
      unwrap(
        api.POST("/orgs/{org}/connections/{id}/briefing/preview", { params: { path: { org: org.slug, id } } }),
      ),
    [org.slug, id],
  );

  return (
    <main>
      <h1>Briefing preview</h1>
      <p className="muted">
        Exactly what the morning briefing would send now. <Link href={`/connections/${id}`}>Back to connection</Link>
      </p>
      <ErrorNote error={error} />
      {loading && <p className="muted" role="status">Loading…</p>}
      {data?.kind === "none" && <p data-testid="briefing-text">Nothing to send: nothing changed since the last briefing.</p>}
      {data && data.kind !== "none" && (
        <>
          <p className="muted">{data.kind === "first_scan" ? "First scan briefing" : "Daily briefing"}</p>
          <pre data-testid="briefing-text" style={{ whiteSpace: "pre-wrap" }}>{data.text}</pre>
        </>
      )}
      <button type="button" onClick={reload} disabled={loading}>
        Refresh preview
      </button>
    </main>
  );
}
