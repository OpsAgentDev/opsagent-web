// The public status page's verdicts (hub status-page.md): brain's counts in, one state per row out.
import type { components } from "@/lib/api/schema";

export type SystemStatus = components["schemas"]["StatusOut"];
export type State = "Operational" | "Degraded" | "Down" | "Unknown";
export type Row = { name: string; state: State; detail: string };

const MAX_WAIT_SECONDS = 15 * 60;

export function statusRows(s: SystemStatus | null, mcpUp: boolean): Row[] {
  const api: Row = { name: "API", state: s ? "Operational" : "Down", detail: "brain.opsagent.dev/v1" };
  const mcp: Row = { name: "MCP", state: mcpUp ? "Operational" : "Down", detail: "brain.opsagent.dev/mcp" };
  if (!s) {
    return [api, mcp,
      { name: "Scans", state: "Unknown", detail: "No data while the API is down" },
      { name: "Deliveries", state: "Unknown", detail: "No data while the API is down" }];
  }
  const { waiting, oldest_wait_seconds: wait } = s.scans;
  const { sent_24h: sent, failed_24h: failed } = s.deliveries;
  const total = sent + failed;
  return [api, mcp,
    {
      name: "Scans",
      state: wait < MAX_WAIT_SECONDS ? "Operational" : "Degraded",
      detail: waiting === 0 ? "No scans waiting" : `${waiting} waiting, oldest ${Math.round(wait / 60)} min`,
    },
    {
      name: "Deliveries",
      state: failed * 20 <= total ? "Operational" : "Degraded",
      detail: `${sent} sent, ${failed} failed in the last 24 hours`,
    }];
}
