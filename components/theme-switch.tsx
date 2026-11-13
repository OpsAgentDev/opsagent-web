"use client";
import { useEffect, useState } from "react";
import { applyChoice, readChoice, THEME_CHOICES, type ThemeChoice } from "@/lib/theme";

const LABEL: Record<ThemeChoice, string> = { system: "System", dark: "Dark", light: "Light" };

/** The one theme control: three buttons, the current one pressed. Used in the app, the site footer and the sign-in pages. */
export function ThemeSwitch() {
  // The server cannot know the stored choice; it is read once the page is live.
  const [choice, setChoice] = useState<ThemeChoice>("dark");
  useEffect(() => {
    const stored = readChoice();
    setChoice(stored);
    if (stored !== "dark") applyChoice(stored); // the page already has the theme; this sets theme-color too
  }, []);
  return (
    <div className="theme-switch" role="group" aria-label="Theme">
      {THEME_CHOICES.map((c) => (
        <button key={c} type="button" aria-pressed={c === choice} onClick={() => { setChoice(c); applyChoice(c); }}>
          {LABEL[c]}
        </button>
      ))}
    </div>
  );
}
