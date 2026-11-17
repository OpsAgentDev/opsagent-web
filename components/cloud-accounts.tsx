"use client";
import { ConnectionCard } from "@/components/connection-card";
import { OrgLink } from "@/components/org-link";
import { api, unwrap } from "@/lib/api/client";
import { neverConnected } from "@/lib/connection-status";
import { scanHistory, type ScanHistory } from "@/lib/scan";

type Scans = { history?: ScanHistory; error?: Error };

/** Connections with each one's finished scans; a failed scan read stays on its own card. */
export async function loadAccounts(org: string) {
  const connections = (await unwrap(api.GET("/orgs/{org}/connections", { params: { path: { org } } }))).filter((c) => !neverConnected(c));
  const scans = await Promise.all(
    connections.map((c) => scanHistory(org, c.id).then((history): Scans => ({ history }), (error: Error): Scans => ({ error }))),
  );
  return connections.map((c, i) => ({ c, ...scans[i] }));
}

export type AccountRow = Awaited<ReturnType<typeof loadAccounts>>[number];

/** The organisation's cloud accounts as cards, and for owners the way to add one. */
export function CloudAccounts({ rows, role }: { rows: AccountRow[]; role: string }) {
  return (
    <>
      <div className="cards accounts">
        {rows.map((r) => <ConnectionCard key={r.c.id} c={r.c} several={rows.length > 1} latest={r.history} error={r.error} />)}
      </div>
      {role === "owner" && (
        <p className="add-more">
          <OrgLink href="/onboarding/connect-aws">{rows.length ? "Connect another account" : "Connect an account"}</OrgLink>
        </p>
      )}
    </>
  );
}
