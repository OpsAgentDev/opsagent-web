import { describe, expect, it } from "vitest";
import { dailyTotals, dayText, flaggedDays, movers, parseUsd, percentText, periods, serviceChanges, signedUsd, usd } from "@/lib/cost";

const row = (day: string, service: string, amount_usd: string) => ({ day, service, amount_usd });
/** Day `n` back from 2026-11-30 (n = 0 is the newest day). */
const back = (n: number) => new Date(Date.UTC(2026, 10, 30 - n)).toISOString().slice(0, 10);
const NEWEST = back(0);

describe("parseUsd", () => {
  it("reads four decimals, fewer decimals, whole numbers and negatives exactly", () => {
    expect(parseUsd("12.3400")).toBe(123400);
    expect(parseUsd("0.1")).toBe(1000);
    expect(parseUsd("7")).toBe(70000);
    expect(parseUsd("-1.5000")).toBe(-15000);
    expect(parseUsd("0.0001")).toBe(1);
  });
  it("rejects anything else instead of returning NaN", () => {
    for (const bad of ["", "abc", "1e3", "1.23456", "--1", "$5", "1,000.00"]) expect(parseUsd(bad)).toBeNull();
  });
});

describe("dailyTotals", () => {
  it("sums services per day, oldest first, with credits netting off", () => {
    const t = dailyTotals([row("2026-11-02", "EC2", "5.0000"), row("2026-11-01", "EC2", "1.0000"), row("2026-11-02", "Support", "-2.5000")]);
    expect(t).toEqual([{ day: "2026-11-01", units: 10000 }, { day: "2026-11-02", units: 25000 }]);
  });
  it("is empty for no rows and drops unreadable amounts", () => {
    expect(dailyTotals([])).toEqual([]);
    expect(dailyTotals([row("2026-11-01", "EC2", "oops")])).toEqual([]);
  });
});

describe("periods", () => {
  it("anchors on the newest day: the 30th day back is current, the 31st is previous, the 60th is previous, the 61st is out", () => {
    const rows = [row(back(0), "A", "1"), row(back(29), "A", "2"), row(back(30), "A", "4"), row(back(59), "A", "8"), row(back(60), "A", "16")];
    const p = periods(rows, NEWEST);
    expect(p.currentTotal).toBe(30000);
    expect(p.previousTotal).toBe(120000);
    expect([p.currentDays, p.previousDays]).toEqual([2, 2]);
  });
  it("counts the days it has when there are fewer than 60", () => {
    const p = periods([row(back(0), "A", "1"), row(back(1), "B", "1"), row(back(40), "A", "1")], NEWEST);
    expect([p.currentDays, p.previousDays]).toEqual([2, 1]);
  });
  it("handles empty data", () => {
    expect(periods([], NEWEST)).toMatchObject({ currentTotal: 0, previousTotal: 0, currentDays: 0, previousDays: 0 });
  });
});

describe("serviceChanges", () => {
  const rows = [
    row(back(1), "EC2", "30.0000"), row(back(40), "EC2", "20.0000"),
    row(back(2), "S3", "5.0000"), // new this period
    row(back(45), "Lambda", "9.0000"), // gone this period
    row(back(3), "Support", "-4.0000"), row(back(35), "Support", "-2.0000"), // credits both periods
    row(back(4), "Tax", "3.0000"), row(back(50), "Tax", "-1.0000"), // previous below zero
  ];
  const by = (name: string) => serviceChanges(rows, NEWEST).find((c) => c.service === name)!;

  it("gives dollars and percent for a service in both periods", () => {
    expect(by("EC2")).toMatchObject({ current: 300000, previous: 200000, change: 100000, percent: 50 });
  });
  it("has no percent for a service only in the current period, but still the dollar change", () => {
    expect(by("S3")).toMatchObject({ previous: 0, change: 50000, percent: null });
  });
  it("keeps a service only in the previous period as a full drop of -100%", () => {
    expect(by("Lambda")).toMatchObject({ current: 0, change: -90000, percent: -100 });
  });
  it("has no percent when the previous is zero or negative", () => {
    expect(by("Tax").percent).toBeNull();
    expect(by("Support")).toMatchObject({ current: -40000, previous: -20000, change: -20000, percent: null });
  });
  it("rounds percent to one decimal, away from zero", () => {
    expect(serviceChanges([row(back(0), "X", "1.0625"), row(back(31), "X", "1.0000")], NEWEST)[0]!.percent).toBe(6.3); // 6.25
    expect(serviceChanges([row(back(0), "X", "1.0000"), row(back(31), "X", "1.0625")], NEWEST)[0]!.percent).toBe(-5.9); // -5.88
    expect(serviceChanges([row(back(0), "X", "1.0000"), row(back(31), "X", "1.0625")], NEWEST)[0]!.change).toBe(-625);
  });
  it("sorts by current spend, largest first, name as the tie-break", () => {
    expect(serviceChanges(rows, NEWEST).map((c) => c.service).slice(0, 2)).toEqual(["EC2", "S3"]);
  });
  it("is empty for no rows", () => expect(serviceChanges([], NEWEST)).toEqual([]));
  it("compares against whatever the previous period has when there are fewer than 60 days", () => {
    expect(serviceChanges([row(back(0), "A", "2"), row(back(1), "A", "2")], NEWEST)[0]).toMatchObject({ current: 40000, previous: 0, percent: null });
  });
});

describe("movers", () => {
  const changes = serviceChanges(
    [row(back(0), "A", "10"), row(back(31), "A", "1"), row(back(0), "B", "1"), row(back(31), "B", "6"), row(back(0), "C", "2"), row(back(31), "C", "2"), row(back(0), "D", "3"), row(back(31), "D", "2")],
    NEWEST,
  );
  it("splits up and down by dollars, biggest first, and leaves unchanged services out", () => {
    const m = movers(changes);
    expect(m.up.map((c) => c.service)).toEqual(["A", "D"]);
    expect(m.down.map((c) => c.service)).toEqual(["B"]);
  });
  it("limits each side", () => expect(movers(changes, 1).up.map((c) => c.service)).toEqual(["A"]));
  it("is empty for nothing", () => expect(movers([])).toEqual({ up: [], down: [] }));
});

describe("flaggedDays", () => {
  it("merges findings of one day, adds that day's total, and lists the newest first", () => {
    const totals = dailyTotals([row("2026-11-20", "EC2", "9.0000")]);
    const out = flaggedDays(
      [{ day: "2026-11-10", finding_id: "f1", status: "open" }, { day: "2026-11-20", finding_id: "f2", status: "open" }, { day: "2026-11-20", finding_id: "f3", status: "resolved" }],
      totals,
    );
    expect(out.map((d) => d.day)).toEqual(["2026-11-20", "2026-11-10"]);
    expect(out[0]).toEqual({ day: "2026-11-20", units: 90000, findings: [{ id: "f2", status: "open" }, { id: "f3", status: "resolved" }] });
    expect(out[1]!.units).toBeNull();
  });
});

describe("formatting", () => {
  it("rounds to cents and writes credits with a minus", () => {
    expect(usd(123456)).toBe("$12.35");
    expect(usd(1234567)).toBe("$123.46");
    expect(usd(-15000)).toBe("-$1.50");
    expect(usd(49)).toBe("$0.00");
    expect(usd(-49)).toBe("$0.00");
    expect(usd(12_345_678_900)).toBe("$1,234,567.89");
  });
  it("signs changes", () => {
    expect(signedUsd(120000)).toBe("+$12.00");
    expect(signedUsd(-32000)).toBe("-$3.20");
    expect(signedUsd(0)).toBe("$0.00");
  });
  it("writes percent, or n/a with no base", () => {
    expect(percentText(12.5)).toBe("+12.5%");
    expect(percentText(-3)).toBe("-3.0%");
    expect(percentText(null)).toBe("n/a");
  });
  it("writes a date-only string without shifting the day", () => expect(dayText("2026-11-30")).toBe("30 Nov 2026"));
});
