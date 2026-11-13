import { describe, expect, it } from "vitest";
import { resolveTheme, THEME_SCRIPT, toChoice } from "@/lib/theme";

describe("resolveTheme", () => {
  it("is dark with nothing stored, whatever the device prefers", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("dark");
    expect(resolveTheme(undefined, false)).toBe("dark");
  });

  it("is the stored choice for Dark and Light, whatever the device prefers", () => {
    for (const systemDark of [true, false]) {
      expect(resolveTheme("dark", systemDark)).toBe("dark");
      expect(resolveTheme("light", systemDark)).toBe("light");
    }
  });

  it("follows the device only when System was chosen", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("treats an unknown stored value as nothing stored", () => {
    expect(toChoice("sepia")).toBe("dark");
    expect(resolveTheme("sepia", false)).toBe("dark");
  });
});

describe("THEME_SCRIPT", () => {
  /** Runs the inline script against a fake page and returns the `data-theme` it set. */
  function run(stored: string | null, broken = false) {
    const dataset: { theme?: string } = {};
    const storage = { getItem: () => { if (broken) throw new Error("blocked"); return stored; } };
    new Function("localStorage", "document", THEME_SCRIPT)(storage, { documentElement: { dataset } });
    return dataset.theme;
  }

  it("sets data-theme only when a known choice is stored", () => {
    expect(run(null)).toBeUndefined();
    expect(run("sepia")).toBeUndefined();
    expect(run("light")).toBe("light");
    expect(run("system")).toBe("system");
    expect(run("dark")).toBe("dark");
  });

  it("does nothing, quietly, when storage is blocked", () => {
    expect(run("light", true)).toBeUndefined();
  });
});
