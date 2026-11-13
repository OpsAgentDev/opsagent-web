// The colour theme: Dark (the default), Light, or System (follows the device). Spec: ArchBoss docs/tech-spec/daylight.md.
export const THEME_CHOICES = ["dark", "light", "system"] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];
export type Theme = "dark" | "light";

export const THEME_KEY = "opsagent.theme";
/** The page colour of each theme, for the browser's `theme-color`. Matches `--bg` in app/globals.css. */
export const THEME_COLOR: Record<Theme, string> = { light: "#F5F7FA", dark: "#0B1020" };

/** A stored value as a choice; anything unknown (or nothing stored) is Dark. */
export function toChoice(stored: string | null | undefined): ThemeChoice {
  return stored === "light" || stored === "system" ? stored : "dark";
}

/** The theme that shows: dark unless Light was chosen, or System was chosen and the device asks for light. */
export function resolveTheme(stored: string | null | undefined, systemDark: boolean): Theme {
  const choice = toChoice(stored);
  return choice === "system" ? (systemDark ? "dark" : "light") : choice;
}

/**
 * Runs inline in <head> before first paint, so a stored Light or System never flashes dark first.
 * With nothing stored it does nothing: the stylesheet's default is dark.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="system"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

/** The stored choice; Dark where nothing is stored or storage is blocked. */
export function readChoice(): ThemeChoice {
  try {
    return toChoice(localStorage.getItem(THEME_KEY));
  } catch {
    return "dark";
  }
}

/** Applies a choice to the page and the browser's `theme-color`, and remembers it; works without storage. */
export function applyChoice(choice: ThemeChoice): void {
  document.documentElement.dataset.theme = choice;
  const theme = resolveTheme(choice, window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
  try {
    localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Storage is blocked: the choice holds for this page only.
  }
}
