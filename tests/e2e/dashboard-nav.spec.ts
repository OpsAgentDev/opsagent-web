import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

const TOP: [string, string][] = [["Dashboard", "/dashboard"], ["Findings", "/findings"], ["Ask OpsAgent", "/chat"], ["Deliveries", "/deliveries"]];
const SETTINGS: [string, string][] = [
  ["Delivery settings", "/settings/delivery"], ["Connected agents", "/settings/agents"], ["Security", "/settings/security"],
  ["Billing", "/settings/billing"], ["AI", "/settings/ai"], ["Human review", "/settings/human-review"],
];

test("dashboard nav: four links, a Settings dropdown, current page marked, phone menu lists everything", async ({ page, request }) => {
  await signUp(page, request);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/findings");
  const nav = page.getByRole("banner").getByRole("navigation", { name: "Main" });
  for (const [name, href] of TOP) await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  await expect(nav.getByRole("link", { name: "Findings", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Billing", exact: true })).toBeHidden();

  const settings = nav.getByRole("button", { name: /Settings/ });
  await expect(settings).not.toHaveAttribute("aria-current");
  await settings.click();
  for (const [name, href] of SETTINGS) await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  await page.keyboard.press("Escape");
  await expect(nav.getByRole("link", { name: "Billing", exact: true })).toBeHidden();
  await expect(settings).toBeFocused();

  await settings.click();
  await nav.getByRole("link", { name: "Billing", exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/billing$/);
  await expect(settings).toHaveAttribute("aria-current", "true");
  await expect(nav.getByRole("link", { name: "Billing", exact: true, includeHidden: true })).toHaveAttribute("aria-current", "page");

  await page.setViewportSize({ width: 390, height: 800 });
  await page.getByRole("button", { name: "Menu" }).click();
  for (const [name] of [...TOP, ...SETTINGS]) await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();

  // A tap below the menu closes it and stays on the page.
  await page.mouse.click(195, 790);
  await expect(page.getByRole("button", { name: "Menu", exact: true })).toHaveAttribute("aria-expanded", "false");
  await expect(page).toHaveURL(/\/settings\/billing$/);
});
