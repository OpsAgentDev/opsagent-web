import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { hasFinishedScan, latestScanStats, overview } from "@/lib/scan";

const ok = (data: unknown) => ({ data, response: new Response() });
const stats = { score: 80, counts_by_severity: { high: 1 } };

/** Newest first, as brain lists them; details by run id. */
function mockRuns(items: { id: string; status: string }[], details: Record<string, unknown>) {
  vi.spyOn(api, "GET").mockImplementation(((path: string, init?: { params?: { path?: { id?: string } } }) =>
    Promise.resolve(path.endsWith("/runs") ? ok({ items }) : ok({ stats: details[init?.params?.path?.id ?? ""] ?? null }))) as never);
}

afterEach(() => vi.restoreAllMocks());

describe("latestScanStats", () => {
  it("keeps earlier results when the newest run failed, and says it failed", async () => {
    mockRuns([{ id: "c", status: "failed" }, { id: "b", status: "done" }], { b: stats });
    expect(await latestScanStats("o", "x")).toEqual({ stats, lastFailed: true });
  });

  it("skips queued and running runs without calling it a failure", async () => {
    mockRuns([{ id: "c", status: "running" }, { id: "b", status: "partial" }], { b: stats });
    expect(await latestScanStats("o", "x")).toEqual({ stats, lastFailed: false });
  });

  it("skips a finished run with no stats", async () => {
    mockRuns([{ id: "c", status: "done" }, { id: "b", status: "done" }], { b: stats });
    expect((await latestScanStats("o", "x")).stats).toEqual(stats);
  });

  it("is first-scan only when nothing finished", async () => {
    mockRuns([{ id: "a", status: "queued" }], {});
    expect(await latestScanStats("o", "x")).toEqual({ stats: null, lastFailed: false });
    mockRuns([], {});
    expect(await latestScanStats("o", "x")).toEqual({ stats: null, lastFailed: false });
  });
});

describe("hasFinishedScan", () => {
  it("is true when any run of the organisation finished, whatever the newest ones did", async () => {
    mockRuns([{ id: "c", status: "running" }, { id: "b", status: "failed" }, { id: "a", status: "partial" }], {});
    expect(await hasFinishedScan("o")).toBe(true);
  });

  it("asks for the whole organisation, not one connection", async () => {
    mockRuns([{ id: "a", status: "done" }], {});
    await hasFinishedScan("o");
    expect(vi.mocked(api.GET).mock.calls[0]?.[1]).toEqual({ params: { path: { org: "o" }, query: { type: "full_scan", limit: 200 } } });
  });

  it("is false while nothing finished", async () => {
    mockRuns([{ id: "b", status: "queued" }, { id: "a", status: "failed" }], {});
    expect(await hasFinishedScan("o")).toBe(false);
    mockRuns([], {});
    expect(await hasFinishedScan("o")).toBe(false);
  });
});

describe("overview", () => {
  it("is dashes (null) until a scan has finished, but counts connected accounts", () => {
    expect(overview([])).toEqual({ score: null, open: null, urgent: null, connected: 0 });
    expect(overview([{ status: "connected", stats: null }, { status: "verifying" }])).toEqual({ score: null, open: null, urgent: null, connected: 1 });
  });

  it("takes the lowest score and sums open and critical + high across accounts", () => {
    const rows = [
      { status: "connected", stats: { score: 80, counts_by_severity: { critical: 1, high: 2, low: 4 } } },
      { status: "degraded", stats: { score: 55, counts_by_severity: { high: 1, medium: 3 } } },
      { status: "connected", stats: null },
    ];
    expect(overview(rows)).toEqual({ score: 55, open: 11, urgent: 4, connected: 2 });
  });

  it("leaves disconnected accounts out", () => {
    const rows = [
      { status: "disconnected", stats: { score: 10, counts_by_severity: { critical: 9 } } },
      { status: "connected", stats: { score: 90, counts_by_severity: {} } },
    ];
    expect(overview(rows)).toEqual({ score: 90, open: 0, urgent: 0, connected: 1 });
  });
});
