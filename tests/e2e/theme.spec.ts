import { expect, test, type Page } from "@playwright/test";
import { openUserMenu, signIn, signUp } from "./helpers";

const DARK = "rgb(11, 16, 32)";
const LIGHT = "rgb(245, 247, 250)";
const pageColour = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const theme = (page: Page) => page.getByRole("group", { name: "Theme" });

test("dark is the default whatever the device prefers; Light is remembered; System follows the device", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("pageerror", (e) => problems.push(e.message));

  // Nothing stored and a device that prefers light: still dark.
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  expect(await pageColour(page)).toBe(DARK);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("dark");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#0B1020");
  await expect(theme(page).getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");

  // Light, by keyboard; it survives a reload and is on <html> before the page's own scripts run.
  await theme(page).getByRole("button", { name: "Light" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await pageColour(page)).toBe(LIGHT);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#F5F7FA");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload({ waitUntil: "commit" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await pageColour(page)).toBe(LIGHT);
  await expect(theme(page).getByRole("button", { name: "Light" })).toHaveAttribute("aria-pressed", "true");
  await expect(theme(page).getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "false");

  // System follows the device, both ways, and also survives a reload.
  await theme(page).getByRole("button", { name: "System" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
  expect(await pageColour(page)).toBe(DARK);
  await page.emulateMedia({ colorScheme: "light" });
  expect(await pageColour(page)).toBe(LIGHT);
  await page.reload();
  expect(await pageColour(page)).toBe(LIGHT);

  // The choice is one setting for the whole site: the sign-in page has it too, with the same control.
  await page.goto("/sign-in");
  expect(await pageColour(page)).toBe(LIGHT);
  await theme(page).getByRole("button", { name: "Dark" }).click();
  expect(await pageColour(page)).toBe(DARK);

  // The inline script ran under the site's CSP without complaint.
  expect(problems.filter((p) => /Content Security Policy|theme/i.test(p))).toEqual([]);
});

test("Geist is served from this origin; nothing is asked of Google Fonts", async ({ page }) => {
  const asked: string[] = [];
  page.on("request", (r) => asked.push(r.url()));
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily)).toMatch(/Geist/);
  expect(asked.some((u) => /\.woff2(\?|$)/.test(u) && u.startsWith("http://localhost:3001/"))).toBe(true);
  expect(asked.filter((u) => /fonts\.(googleapis|gstatic)\.com/.test(u))).toEqual([]);
});

test("the theme switch is in the app's sidebar, not in onboarding, and both themes paint the app", async ({ page, request }) => {
  await signIn(page, request, { onboard: false });
  await expect(page.getByText("Step 1 of 2")).toBeVisible();
  await expect(theme(page)).toHaveCount(0);

  const fresh = await page.context().browser()!.newContext();
  const app = await fresh.newPage();
  await signUp(app, request);
  await app.goto("/dashboard");
  await openUserMenu(app);
  const inSidebar = app.locator(".sidebar").getByRole("group", { name: "Theme" });
  await expect(inSidebar).toBeVisible();
  expect(await pageColour(app)).toBe(DARK);
  await inSidebar.getByRole("button", { name: "Light" }).click();
  expect(await pageColour(app)).toBe(LIGHT);
  // In light the page is white and the sidebar carries the tint.
  const bg = (sel: string) => app.locator(sel).first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await bg(".app")).toBe("rgb(255, 255, 255)");
  expect(await bg(".sidebar")).toBe("rgb(245, 247, 250)");
  await fresh.close();
});
