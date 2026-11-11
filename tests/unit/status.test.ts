import { describe, expect, it } from "vitest";
import { statusRows, type SystemStatus } from "@/lib/status";

const ok: SystemStatus = {
  scans: { waiting: 0, oldest_wait_seconds: 0 },
  deliveries: { sent_24h: 100, failed_24h: 5 },
  checked_at: "2026-11-11T00:00:00Z",
};
const states = (s: SystemStatus | null, mcp = true) => statusRows(s, mcp).map((r) => r.state);

describe("statusRows", () => {
  it("is all operational on healthy numbers (5% failures is the limit)", () => {
    expect(states(ok)).toEqual(["Operational", "Operational", "Operational", "Operational"]);
  });
  it("degrades scans at a 15 minute wait and deliveries above 5% failures", () => {
    const bad = { ...ok, scans: { waiting: 3, oldest_wait_seconds: 900 }, deliveries: { sent_24h: 10, failed_24h: 1 } };
    expect(states(bad)).toEqual(["Operational", "Operational", "Degraded", "Degraded"]);
  });
  it("reports unknown counts when the API is down, and MCP on its own", () => {
    expect(states(null, false)).toEqual(["Down", "Down", "Unknown", "Unknown"]);
  });
  it("treats no deliveries as operational", () => {
    expect(states({ ...ok, deliveries: { sent_24h: 0, failed_24h: 0 } })[3]).toBe("Operational");
  });
});
