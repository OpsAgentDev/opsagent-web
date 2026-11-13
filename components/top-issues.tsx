"use client";
import Link from "next/link";
import { Severity } from "@/components/badges";
import { ErrorNote } from "@/components/error-note";
import { topIssues } from "@/lib/findings";
import { useApi } from "@/lib/use-api";
import "./overview.css";

export type Issue = { id: string; severity: string; title: string; resource_identity: string };

/** Findings as rows: severity, title, resource. `linked` is off for the landing page's sample. */
export function IssueList({ items, label, linked = true }: { items: Issue[]; label: string; linked?: boolean }) {
  return (
    <ul className="ov-issues" aria-label={label}>
      {items.map((f) => (
        <li key={f.id}>
          <Severity value={f.severity} />
          {linked ? <Link href={`/findings/${f.id}`}>{f.title}</Link> : <span className="ov-issue-title">{f.title}</span>}
          <code>{f.resource_identity}</code>
        </li>
      ))}
    </ul>
  );
}

/** The open critical and high findings of one connection, or of every connected account, or a calm line when there are none. */
export function TopIssues({ org, connection, limit = 3, label = "Top open issues" }: { org: string; connection?: string; limit?: number; label?: string }) {
  const { data, error } = useApi(() => topIssues(org, connection, limit), [org, connection, limit]);
  if (error) return <ErrorNote error={error} />;
  if (!data) return null;
  if (data.length === 0) return <p className="ov-calm">No critical or high findings.</p>;
  return <IssueList items={data} label={label} />;
}
