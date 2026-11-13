import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { deltaText, greeting, hasFinishedScan, overview, scanHistory, sinceLast, trendSeries } from "@/lib/scan";

const ok = (data: unknown) => ({ data, response: new Response() });
const stats = { score: 80, counts_by_severity: { high: 1 } };

const at = (id: string) => `2026-11-${id}T02:00:00Z`;

/** Newest first, as brain lists them (the id is the day of the month); details by run id. */
function mockRuns(items: { id: string; status: string }[], details: Record<string, unknown>) {
  const list = items.map((i) => ({ ...i, scheduled_at: at(i.id), finished_at: at(i.id) }));
  vi.spyOn(api, "GET").mockImplementation(((path: string, init?: { params?: { path?: { id?: string } } }) =>
    Promise.resolve(path.endsWith("/runs") ? ok({ items: list }) : ok({ stats: details[init?.params?.path?.id ?? ""] ?? null }))) as never);
}

afterEach(() => vi.restoreAllMocks());

describe("scanHistory", () => {
  it("keeps earlier results when the newest run failed, and says it failed", async () => {
    mockRuns([{ id: "13", status: "failed" }, { id: "12", status: "done" }], { 12: stats });
    expect(await scanHistory("o", "x")).toEqual({ stats, lastFailed: true, running: false, scans: [{ at: at("12"), stats }] });
  });

  it("skips queued and running runs without calling it a failure", async () => {
    mockRuns([{ id: "13", status: "running" }, { id: "12", status: "partial" }], { 12: stats });
    expect(await scanHistory("o", "x")).toMatchObject({ stats, lastFailed: false, running: true });
  });

  it("skips a finished run with no stats", async () => {
    mockRuns([{ id: "13", status: "done" }, { id: "12", status: "done" }], { 12: stats });
    expect((await scanHistory("o", "x")).scans).toEqual([{ at: at("12"), stats }]);
  });

  it("is first-scan only when nothing finished", async () => {
    mockRuns([{ id: "11", status: "queued" }], {});
    expect(await scanHistory("o", "x")).toEqual({ stats: null, lastFailed: false, running: true, scans: [] });
    mockRuns([], {});
    expect(await scanHistory("o", "x")).toEqual({ stats: null, lastFailed: false, running: false, scans: [] });
  });

  it("lists scans newest first and reads no more than the cap", async () => {
    const days = Array.from({ length: 20 }, (_, i) => String(29 - i));
    mockRuns(days.map((id) => ({ id, status: "done" })), Object.fromEntries(days.map((id) => [id, stats])));
    const { scans } = await scanHistory("o", "x");
    expect(scans).toHaveLength(14);
    expect(scans[0]?.at).toBe(at("29"));
    expect(vi.mocked(api.GET)).toHaveBeenCalledTimes(15); // the list, then one detail per kept scan
  });
});

const scan = (day: number, counts: Record<string, number>) => ({ at: `2026-11-${String(day).padStart(2, "0")}T02:00:00Z`, stats: { counts_by_severity: counts } });

describe("trendSeries", () => {
  it("is one point per scan, oldest first, whatever order the scans arrive in", () => {
    expect(trendSeries([[scan(3, { critical: 1, low: 2 }), scan(1, { high: 5 }), scan(2, {})]])).toEqual([
      { at: scan(1, {}).at, open: 5, critical: 0 },
      { at: scan(2, {}).at, open: 0, critical: 0 },
      { at: scan(3, {}).at, open: 3, critical: 1 },
    ]);
  });

  it("sums accounts, carrying each account's newest scan forward", () => {
    const a = [scan(1, { critical: 1 }), scan(3, { critical: 2 })];
    const b = [scan(2, { medium: 4 })];
    expect(trendSeries([a, b]).map((p) => [p.open, p.critical])).toEqual([[1, 1], [5, 1], [6, 2]]);
  });

  it("keeps the newest points up to the cap, and is empty with no scans", () => {
    const many = Array.from({ length: 20 }, (_, i) => scan(i + 1, { low: i }));
    const points = trendSeries([many]);
    expect(points).toHaveLength(14);
    expect(points.at(-1)?.open).toBe(19);
    expect(trendSeries([many], 3).map((p) => p.open)).toEqual([17, 18, 19]);
    expect(trendSeries([])).toEqual([]);
    expect(trendSeries([[], []])).toEqual([]);
  });
});

describe("sinceLast, deltaText, greeting", () => {
  it("compares the newest scan with the one before it, and is unknown with fewer than two", () => {
    const p = (open: number, critical: number) => ({ at: "", open, critical });
    expect(sinceLast([])).toBeNull();
    expect(sinceLast([p(4, 1)])).toBeNull();
    expect(sinceLast([p(9, 0), p(4, 1), p(6, 3)])).toEqual({ openDelta: 2, newCritical: 2 });
    expect(sinceLast([p(6, 3), p(2, 1)])).toEqual({ openDelta: -4, newCritical: 0 });
  });

  it("says the change in words", () => {
    expect(deltaText(-4)).toBe("4 fewer than the previous scan");
    expect(deltaText(1)).toBe("1 more than the previous scan");
    expect(deltaText(0)).toBe("Same as the previous scan");
  });

  it("greets by the hour", () => {
    expect([0, 4, 5, 11, 12, 17, 18, 23].map(greeting)).toEqual([
      "Good evening", "Good evening", "Good morning", "Good morning", "Good afternoon", "Good afternoon", "Good evening", "Good evening",
    ]);
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
