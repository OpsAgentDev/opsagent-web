"use client";
import Link from "next/link";
import { Severity } from "@/components/badges";
import { ErrorNote } from "@/components/error-note";
import { topIssues } from "@/lib/findings";
import { useApi } from "@/lib/use-api";

/** The open critical and high findings of one connection (at most three), or a calm line when there are none. */
export function TopIssues({ org, connection }: { org: string; connection: string }) {
  const { data, error } = useApi(() => topIssues(org, connection), [org, connection]);
  if (error) return <ErrorNote error={error} />;
  if (!data) return null;
  if (data.length === 0) return <p className="muted top-issues-none">No critical or high findings.</p>;
  return (
    <ul className="top-issues" aria-label="Top open issues">
      {data.map((f) => (
        <li key={f.id}>
          <Severity value={f.severity} />
          <Link href={`/findings/${f.id}`}>{f.title}</Link>
        </li>
      ))}
    </ul>
  );
}
