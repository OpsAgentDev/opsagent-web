import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Both token sets, read from the stylesheet itself so the check cannot drift from what ships.
const css = readFileSync("app/globals.css", "utf8");
const block = (start: string) => {
  const from = css.indexOf(start);
  if (from < 0) throw new Error(`no block ${start}`);
  return css.slice(from, css.indexOf("}", from));
};
const SETS = {
  dark: block(":root {"),
  light: block(':root[data-theme="light"] {'),
  "light (system)": block(':root[data-theme="system"] {'),
};

type Rgb = [number, number, number];
const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** A token as an opaque colour; a translucent one (the dark tints) is laid over `under` first. */
function token(set: string, name: string, under?: Rgb): Rgb {
  const value = set.match(new RegExp(`--${name}: (#[0-9a-fA-F]{6}|rgba\\([^)]+\\))`))?.[1];
  if (!value) throw new Error(`no colour token --${name}`);
  if (value.startsWith("#")) return hex(value);
  const [r = 0, g = 0, b = 0, a = 1] = value.slice(5, -1).split(",").map(Number);
  if (!under) throw new Error(`--${name} is translucent: say what it sits on`);
  return [r, g, b].map((c, i) => c * a + (under[i] ?? 0) * (1 - a)) as Rgb;
}

function luminance(c: Rgb) {
  const lin = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
}
function contrast(a: Rgb, b: Rgb) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** [what, text, background]: every pair the stylesheets put text on. Tints are checked on the panel colour. */
function pairs(set: string): [string, Rgb, Rgb][] {
  const t = (name: string) => token(set, name);
  const surface = t("surface");
  const tint = (name: string) => token(set, name, surface);
  const sheen = hex(set.match(/--btn-grad: linear-gradient\(180deg, (#[0-9a-fA-F]{6})/)?.[1] ?? "");
  return [
    ["body on page", t("body"), t("bg")],
    ["body on panel", t("body"), surface],
    ["body on raised", t("body"), t("surface-2")],
    ["muted on page", t("soft"), t("bg")],
    ["muted on panel", t("soft"), surface],
    ["muted on raised", t("soft"), t("surface-2")],
    ["muted on band", t("soft"), t("band")],
    ["heading on page", t("ink"), t("bg")],
    ["accent on page", t("accent"), t("bg")],
    ["accent on panel", t("accent"), surface],
    ["accent on its tint", t("accent"), tint("accent-bg")],
    ["button text on accent", t("accent-ink"), t("accent")],
    ["button text on accent, hover", t("accent-ink"), t("accent-hover")],
    ["button text on the sheen's lightest stop", t("accent-ink"), sheen],
    ["sign-in submit: page colour on ink", t("bg"), t("ink")],
    ["critical pill", t("on-bad"), t("bad")],
    ["critical text on panel", t("bad-ink"), surface],
    ["critical text on its tint", t("bad-ink"), tint("bad-bg")],
    ["high pill", t("high-ink"), tint("high-bg")],
    ["medium pill", t("warn-ink"), tint("warn-bg")],
    ["medium text on page", t("warn-ink"), t("bg")],
    ["low pill", t("ink"), t("surface-2")],
    ["info pill", t("soft"), surface],
    ["ok text on its tint", t("ok-ink"), tint("ok-bg")],
    ["ok text on page", t("ok-ink"), t("bg")],
    ["device panel text", t("device-ink"), t("device")],
    ["device panel muted", t("device-soft"), t("device")],
    ["device panel accent", t("device-accent"), t("device")],
  ];
}

describe.each(["dark", "light"] as const)("%s theme contrast", (name) => {
  it.each(pairs(SETS[name]))("%s is at least 4.5:1", (_what, text, background) => {
    expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
  });

  it("input borders are at least 3:1 on the panel", () => {
    expect(contrast(token(SETS[name], "line-strong"), token(SETS[name], "surface"))).toBeGreaterThanOrEqual(3);
  });
});

describe("theme tokens", () => {
  const body = (set: string) => set.slice(set.indexOf("--bg:")).replace(/\s+/g, " ").trim();

  it("the light set is the same under Light and under System", () => {
    expect(body(SETS["light (system)"])).toBe(body(SETS.light));
  });

  it("light defines every token dark does, so nothing falls back to a dark value", () => {
    const names = (set: string) => [...set.matchAll(/(--[a-z0-9-]+):/g)].map((m) => m[1]).filter((n) => n !== "--font" && n !== "--muted").sort();
    expect(names(SETS.light)).toEqual(names(SETS.dark));
  });

  it("dark is the palette the product launched with", () => {
    const t = (n: string) => SETS.dark.match(new RegExp(`--${n}: (#[0-9a-fA-F]{6})`))?.[1]?.toLowerCase();
    expect(["bg", "surface", "surface-2", "ink", "body", "soft", "line", "accent", "ok", "warn", "bad"].map(t))
      .toEqual(["#0b1020", "#121a2e", "#182238", "#e7eaf2", "#c3c9d6", "#9aa3b5", "#26304a", "#22d3ee", "#34d399", "#fbbf24", "#f87171"]);
  });
});
