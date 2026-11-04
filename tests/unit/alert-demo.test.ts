import { describe, expect, it } from "vitest";
import { ADVANCE_MS, TABS, TAB_LABEL, demoReducer, initialState, nextIndex } from "@/lib/alert-demo";

describe("alert demo", () => {
  it("moves between tabs with the keyboard", () => {
    expect(nextIndex(4, "ArrowRight", 5)).toBe(0);
    expect(nextIndex(0, "ArrowLeft", 5)).toBe(4);
    expect(nextIndex(2, "Home", 5)).toBe(0);
    expect(nextIndex(2, "End", 5)).toBe(4);
    expect(nextIndex(2, "a", 5)).toBeNull();
  });
  it("ticks only in auto mode", () => {
    expect(demoReducer({ index: 4, mode: "auto" }, { type: "tick" })).toEqual({ index: 0, mode: "auto" });
    expect(demoReducer({ index: 1, mode: "paused" }, { type: "tick" }).index).toBe(1);
    expect(demoReducer({ index: 1, mode: "stopped" }, { type: "tick" }).index).toBe(1);
  });
  it("hover pauses, leave resumes, interaction stops for good", () => {
    const paused = demoReducer({ index: 0, mode: "auto" }, { type: "hover" });
    expect(paused.mode).toBe("paused");
    expect(demoReducer(paused, { type: "leave" }).mode).toBe("auto");
    const stopped = demoReducer({ index: 0, mode: "auto" }, { type: "interact" });
    expect(demoReducer(stopped, { type: "leave" }).mode).toBe("stopped");
    expect(demoReducer(stopped, { type: "hover" }).mode).toBe("stopped");
    expect(demoReducer({ index: 0, mode: "auto" }, { type: "select", index: 3 })).toEqual({ index: 3, mode: "stopped" });
  });
  it("never starts under reduced motion", () => {
    expect(initialState(true)).toEqual({ index: 0, mode: "stopped" });
    expect(initialState(false)).toEqual({ index: 0, mode: "auto" });
    expect(ADVANCE_MS).toBe(6000);
  });
  it("labels the five tabs in order", () => {
    expect(TABS.map((t) => TAB_LABEL[t])).toEqual(["Overnight", "Night watch", "Morning briefing", "Urgent", "Everything"]);
  });
});
