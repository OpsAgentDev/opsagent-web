"use client";
import { CloudAccounts, loadAccounts } from "@/components/cloud-accounts";
import { ErrorNote } from "@/components/error-note";
import { Skeleton } from "@/components/skeleton";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

export default function CloudAccountsPage() {
  const org = useOrg();
  const { data: rows, error } = useApi(() => loadAccounts(org.slug), [org.slug]);
  return (
    <main>
      <h1>Cloud accounts</h1>
      <ErrorNote error={error} />
      {!rows && !error && <Skeleton count={1} />}
      {rows && !rows.length && <p className="muted empty">No cloud account connected yet.</p>}
      {rows && <CloudAccounts rows={rows} role={org.role} />}
    </main>
  );
}
