"use client";
import { useEffect } from "react";
import { StatusPage } from "@/components/status-page";
import { log } from "@/lib/log";

export default function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    log.error("page crashed", { digest: error.digest });
  }, [error]);
  return (
    <StatusPage title="Something went wrong" extra={<button type="button" onClick={reset}>Try again</button>}>
      Nothing was lost. Try again, or head back to the dashboard.
    </StatusPage>
  );
}
