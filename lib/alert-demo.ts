/** Pure state for the landing page's tabbed alert demo; the component only wires events to it. */

export const TABS = ["overnight", "night-watch", "morning", "urgent", "everything"] as const;
export type TabId = (typeof TABS)[number];

export const TAB_LABEL: Record<TabId, string> = {
  overnight: "Overnight",
  "night-watch": "Night watch",
  morning: "Morning briefing",
  urgent: "Urgent",
  everything: "Everything",
};

export const ADVANCE_MS = 6000;

/** Roving-focus target for a key press on tab `i` of `n`, or null when the key is not a tab key. */
export function nextIndex(i: number, key: string, n: number): number | null {
  switch (key) {
    case "ArrowRight":
      return (i + 1) % n;
    case "ArrowLeft":
      return (i - 1 + n) % n;
    case "Home":
      return 0;
    case "End":
      return n - 1;
    default:
      return null;
  }
}

export type DemoState = { index: number; mode: "auto" | "paused" | "stopped" };
export type DemoAction = { type: "tick" | "hover" | "leave" | "interact" | "select"; index?: number };

export function demoReducer(s: DemoState, a: DemoAction): DemoState {
  switch (a.type) {
    case "tick":
      return s.mode === "auto" ? { ...s, index: (s.index + 1) % TABS.length } : s;
    case "hover":
      return s.mode === "auto" ? { ...s, mode: "paused" } : s;
    case "leave":
      return s.mode === "paused" ? { ...s, mode: "auto" } : s;
    case "interact":
      return s.mode === "stopped" ? s : { ...s, mode: "stopped" };
    case "select":
      return { index: a.index ?? s.index, mode: "stopped" };
  }
}

export function initialState(reducedMotion: boolean): DemoState {
  return { index: 0, mode: reducedMotion ? "stopped" : "auto" };
}
