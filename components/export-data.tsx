"use client";
import { useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";

/** Owners download the organisation's data as one JSON file; brain allows it once an hour and says so when it refuses. */
export function ExportData({ org }: { org: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const blob = (await unwrap(api.POST("/orgs/{org}/export", { params: { path: { org } }, parseAs: "blob" }))) as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `opsagent-export-${org}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err as Error);
    }
    setBusy(false);
  }

  return (
    <section className="card stack">
      <h2>Export your data</h2>
      <p>
        One JSON file with the organisation, its members, cloud accounts, findings with their evidence, delivery settings,
        recipients, delivery history and the audit log. It holds no credentials. You can download it once an hour.
      </p>
      <p><button type="button" onClick={download} disabled={busy}>{busy ? "Preparing…" : "Download JSON"}</button></p>
      <ErrorNote error={error} showCode={false} />
    </section>
  );
}
