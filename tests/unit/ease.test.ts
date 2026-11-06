import { describe, expect, it } from "vitest";
import { countAt, easeOutCubic } from "@/lib/ease";
import { revealer } from "@/lib/reveal";

describe("count-up easing", () => {
  it("eases out from 0 to 1 and clamps", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
  });
  it("counts whole numbers and ends exactly on the target", () => {
    expect(countAt(15, 0, 1200)).toBe(0);
    expect(countAt(15, 600, 1200)).toBe(13);
    expect(countAt(15, 1200, 1200)).toBe(15);
    expect(countAt(15, 5000, 1200)).toBe(15);
    expect(countAt(0, 600, 1200)).toBe(0);
  });
});

class FakeObserver {
  observed = new Set<Element>();
  disconnected = false;
  constructor(public cb: (entries: { target: Element; isIntersecting: boolean }[]) => void) {}
  observe(el: Element) { this.observed.add(el); }
  unobserve(el: Element) { this.observed.delete(el); }
  disconnect() { this.disconnected = true; this.observed.clear(); }
}

describe("reveal observer", () => {
  const el = (n: number) => ({ n }) as unknown as Element;

  it("shares one observer, fires once per element, then stops watching it", () => {
    const made: FakeObserver[] = [];
    const r = revealer((cb) => { const o = new FakeObserver(cb); made.push(o); return o; });
    const seen: number[] = [];
    const a = el(1), b = el(2);
    r.watch(a, () => seen.push(1));
    r.watch(b, () => seen.push(2));
    expect(made).toHaveLength(1);
    made[0]!.cb([{ target: a, isIntersecting: true }, { target: b, isIntersecting: false }]);
    made[0]!.cb([{ target: a, isIntersecting: true }]);
    expect(seen).toEqual([1]);
    expect(made[0]!.observed.has(a)).toBe(false);
    expect(r.size()).toBe(1);
  });

  it("cleans up on unmount and disconnects when nothing is left", () => {
    const made: FakeObserver[] = [];
    const r = revealer((cb) => { const o = new FakeObserver(cb); made.push(o); return o; });
    const stop = r.watch(el(1), () => {});
    stop();
    stop(); // idempotent
    expect(r.size()).toBe(0);
    expect(made[0]!.disconnected).toBe(true);
    r.watch(el(2), () => {});
    expect(made).toHaveLength(2); // a fresh observer after the old one was dropped
  });
});
