import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHECK_WAIT_MS, submitDisabled, watchCheck } from "@/lib/turnstile";

describe("submitDisabled", () => {
  it("is off without a site key, whatever the token", () => {
    expect(submitDisabled({ busy: false, siteKey: "", token: null })).toBe(false);
  });
  it("waits for a token when a site key is set", () => {
    expect(submitDisabled({ busy: false, siteKey: "k", token: null })).toBe(true);
    expect(submitDisabled({ busy: false, siteKey: "k", token: "t" })).toBe(false);
  });
  it("is always disabled while busy", () => {
    expect(submitDisabled({ busy: true, siteKey: "", token: null })).toBe(true);
    expect(submitDisabled({ busy: true, siteKey: "k", token: "t" })).toBe(true);
  });
});

describe("watchCheck", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("says the check is late after 10 seconds without a token, not before", () => {
    const setLate = vi.fn();
    watchCheck("k", null, setLate);
    vi.advanceTimersByTime(CHECK_WAIT_MS - 1);
    expect(setLate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(setLate).toHaveBeenCalledExactlyOnceWith(true);
    expect(CHECK_WAIT_MS).toBe(10_000);
  });
  it("clears the notice and stops waiting when the token arrives (the effect's cleanup)", () => {
    const setLate = vi.fn();
    const stop = watchCheck("k", null, setLate);
    vi.advanceTimersByTime(CHECK_WAIT_MS);
    stop?.();
    expect(setLate).toHaveBeenLastCalledWith(false);
    const early = vi.fn();
    watchCheck("k", null, early)?.();
    vi.advanceTimersByTime(CHECK_WAIT_MS);
    expect(early).not.toHaveBeenCalledWith(true);
  });
  it("never waits without a site key, or once there is a token", () => {
    const setLate = vi.fn();
    expect(watchCheck("", null, setLate)).toBeUndefined();
    expect(watchCheck("k", "t", setLate)).toBeUndefined();
    vi.advanceTimersByTime(CHECK_WAIT_MS * 2);
    expect(setLate).not.toHaveBeenCalled();
  });
});
