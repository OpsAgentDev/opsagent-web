import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

const TOP: [string, string][] = [["Dashboard", "/dashboard"], ["Findings", "/findings"], ["Ask OpsAgent", "/chat"], ["Deliveries", "/deliveries"]];
const SETTINGS: [string, string][] = [
  ["Delivery settings", "/settings/delivery"], ["Connected agents", "/settings/agents"], ["Security", "/settings/security"],
  ["Members", "/settings/members"], ["Billing", "/settings/billing"], ["AI", "/settings/ai"],
  ["Human review", "/settings/human-review"], ["Account", "/settings/account"],
];

test("app shell: sidebar with every link, current page marked, top bar, phone drawer opens and closes", async ({ page, request }) => {
  const email = await signUp(page, request);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/findings");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const [name, href] of TOP) await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  await expect(nav.getByRole("link", { name: "Findings", exact: true })).toHaveAttribute("aria-current", "page");
  // Settings links are always visible, in their own labelled group.
  const settings = nav.getByRole("group", { name: "Settings" });
  for (const [name, href] of SETTINGS) await expect(settings.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  await expect(nav.getByRole("link")).toHaveCount(TOP.length + SETTINGS.length);
  for (const link of await nav.getByRole("link").all()) await expect(link.locator("svg")).toBeVisible(); // an icon on every link

  // Top bar: the organisation as plain text (one organisation), the account email; no Menu button on desktop.
  const bar = page.getByRole("banner");
  await expect(bar.getByText(/^E2E \d+$/)).toBeVisible();
  await expect(bar.getByRole("button", { name: /^Organisation:/ })).toHaveCount(0);
  await expect(bar.getByText(email)).toBeVisible();
  const menu = bar.getByRole("button", { name: "Menu", exact: true });
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

  await nav.getByRole("link", { name: "Billing", exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/billing$/);
  await expect(nav.getByRole("link", { name: "Billing", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Findings", exact: true })).not.toHaveAttribute("aria-current");

  // Phone: the sidebar is a drawer.
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(nav).toBeHidden();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  for (const [name] of [...TOP, ...SETTINGS]) await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();

  // Escape closes it and focus returns to the button.
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
  await expect(menu).toBeFocused();

  // A tap outside the drawer closes it and stays on the page.
  await menu.click();
  await expect(nav).toBeVisible();
  await page.mouse.click(370, 400);
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(nav).toBeHidden();
  await expect(page).toHaveURL(/\/settings\/billing$/);

  // A link in the drawer navigates and closes it.
  await menu.click();
  await nav.getByRole("link", { name: "Deliveries", exact: true }).click();
  await expect(page).toHaveURL(/\/deliveries$/);
  await expect(nav).toBeHidden();
});
