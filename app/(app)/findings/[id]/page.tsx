"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorNote } from "@/components/error-note";
import { ExplainPanel } from "@/components/explain-panel";
import { api, unwrap } from "@/lib/api/client";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

const when = (iso: string) => new Date(iso).toLocaleString();

export default function FindingPage() {
  const org = useOrg();
  const { id } = useParams<{ id: string }>();
  const { data: f, error } = useApi(
    () => unwrap(api.GET("/orgs/{org}/findings/{id}", { params: { path: { org: org.slug, id } } })),
    [org.slug, id],
  );

  return (
    <main>
      <p><Link href="/findings">Findings</Link></p>
      <ErrorNote error={error} />
      {!f && !error && <p className="muted" role="status">Loading…</p>}
      {f && (
        <>
          <h1>{f.title}</h1>
          <p>
            {f.severity} · {f.status} · <code>{f.resource_identity}</code>
          </p>
          {f.summary && <p>{f.summary}</p>}
          {f.next_step && <p><strong>Next step:</strong> {f.next_step}</p>}
          <ExplainPanel org={org.slug} id={f.id} role={org.role} cached={f.explanation ?? null} />
          <section>
            <h2>Evidence</h2>
            {f.evidence.length === 0 && <p className="muted">No evidence kept for this finding.</p>}
            {f.evidence.map((e) => (
              <div key={`${e.run_id}-${e.source}-${e.created_at}`}>
                <p className="muted">
                  {e.source} · {when(e.created_at)}
                  {e.redacted ? " · redacted" : ""}
                </p>
                <pre>{e.excerpt}</pre>
              </div>
            ))}
          </section>
          <section>
            <h2>Events</h2>
            <table>
              <tbody>
                {f.events.map((e, i) => (
                  <tr key={i}>
                    <td>{when(e.created_at)}</td>
                    <td>{e.event_type}</td>
                    <td className="muted">
                      {e.from_severity && e.to_severity ? `${e.from_severity} → ${e.to_severity}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}
