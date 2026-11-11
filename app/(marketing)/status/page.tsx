import type { Metadata } from "next";
import createClient from "openapi-fetch";
import { API_BASE_URL } from "@/lib/api/client";
import type { paths } from "@/lib/api/schema";
import { statusRows, type State, type SystemStatus } from "@/lib/status";

export const metadata: Metadata = {
  title: "Status · OpsAgent",
  description: "Live status of the OpsAgent API, MCP server, scans and alert delivery.",
};

// Rebuilt at most once a minute; brain caches its own answer for 30 seconds.
export const revalidate = 60;

const TIMEOUT_MS = 5000;
const anon = createClient<paths>({ baseUrl: `${API_BASE_URL}/v1`, credentials: "omit" });

async function fetchStatus(): Promise<SystemStatus | null> {
  try {
    const { data } = await anon.GET("/status", { signal: AbortSignal.timeout(TIMEOUT_MS) });
    return data ?? null;
  } catch {
    return null;
  }
}

/** MCP needs a token, so any answer below 500 (usually 401) means it is up. */
async function mcpUp(): Promise<boolean> {
  try {
    // /mcp is not in the REST schema, so the typed client cannot reach it.
    // eslint-disable-next-line no-restricted-globals
    const res = await fetch(`${API_BASE_URL}/mcp`, { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate } });
    return res.status < 500;
  } catch {
    return false;
  }
}

const TONE: Record<State, string> = { Operational: "ok", Degraded: "warn", Down: "bad", Unknown: "unknown" };

export default async function Status() {
  const [status, mcp] = await Promise.all([fetchStatus(), mcpUp()]);
  const rows = statusRows(status, mcp);
  const allOk = rows.every((r) => r.state === "Operational");
  return (
    <main className="page">
      <h1>Status</h1>
      <p className="lead">{allOk ? "All systems operational." : "Some systems are not fully operational."}</p>
      <ul className="status-list">
        {rows.map((r) => (
          <li key={r.name}>
            <div>
              <strong>{r.name}</strong>
              <span className="status-detail">{r.detail}</span>
            </div>
            <span className={`status-pill status-${TONE[r.state]}`}>{r.state}</span>
          </li>
        ))}
      </ul>
      <p className="status-checked">
        Checked {status ? new Date(status.checked_at).toUTCString() : "just now"}. Updated every minute. Questions or an
        outage to report? Use the <a href="/contact">contact form</a>.
      </p>
    </main>
  );
}
