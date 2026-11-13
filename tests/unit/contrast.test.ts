import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The Daylight tokens, read from the stylesheet itself so the check cannot drift from what ships.
const css = readFileSync("app/globals.css", "utf8");
const token = (name: string) => {
  const hex = css.match(new RegExp(`--${name}: (#[0-9a-fA-F]{6})`))?.[1];
  if (!hex) throw new Error(`no colour token --${name}`);
  return hex;
};

function luminance(hex: string) {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}
function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const WHITE = "#FFFFFF";
/** [what, text, background]: every pair the stylesheets put text on. */
const TEXT: [string, string, string][] = [
  ["body on page", token("body"), token("bg")],
  ["body on surface", token("body"), token("surface")],
  ["muted on page", token("soft"), token("bg")],
  ["muted on surface", token("soft"), token("surface")],
  ["muted on the hover fill", token("soft"), token("surface-2")],
  ["heading on page", token("ink"), token("bg")],
  ["primary on white", token("accent"), WHITE],
  ["primary on page", token("accent"), token("bg")],
  ["primary on its tint (current nav item, pill)", token("accent"), token("accent-bg")],
  ["white on primary", token("accent-ink"), token("accent")],
  ["white on primary, hover", token("accent-ink"), token("accent-hover")],
  ["critical pill: white on critical", WHITE, token("bad")],
  ["critical number on surface", token("bad"), token("surface")],
  ["critical text on its tint", token("bad-ink"), token("bad-bg")],
  ["critical text on page", token("bad-ink"), token("bg")],
  ["high pill", token("high-ink"), token("high-bg")],
  ["medium pill", token("warn-ink"), token("warn-bg")],
  ["medium text on page", token("warn-ink"), token("bg")],
  ["low pill", token("body"), token("surface-2")],
  ["info pill", token("soft"), token("surface")],
  ["ok text on its tint", token("ok-ink"), token("ok-bg")],
  ["ok text on page", token("ok-ink"), token("bg")],
  ["device panel text", token("device-ink"), token("device")],
  ["device panel muted", token("device-soft"), token("device")],
  ["device panel accent", token("device-accent"), token("device")],
];

describe("Daylight contrast", () => {
  it.each(TEXT)("%s is at least 4.5:1", (_what, text, background) => {
    expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
  });

  it("input borders are at least 3:1 on the surface", () => {
    expect(contrast(token("line-strong"), token("surface"))).toBeGreaterThanOrEqual(3);
  });

  it("uses the spec's primary, page and severity colours", () => {
    expect([token("bg"), token("surface"), token("line"), token("ink"), token("body"), token("soft"), token("accent")])
      .toEqual(["#F5F7FA", "#FFFFFF", "#E3E8EF", "#0E1B33", "#3D4B66", "#5B6B85", "#2553E6"]);
    expect([token("bad"), token("high"), token("warn"), token("ok")]).toEqual(["#D92D20", "#E8730C", "#C99700", "#12936A"]);
  });
});
