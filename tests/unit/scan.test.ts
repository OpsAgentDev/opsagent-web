import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { hasFinishedScan, latestScanStats } from "@/lib/scan";

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
