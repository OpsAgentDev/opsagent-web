import { expect, test } from "@playwright/test";

const NAV: [string, string][] = [
  ["How it works", "/how-it-works"],
  ["Security", "/security"],
  ["Pricing", "/pricing"],
  ["Docs", "/docs/connect-your-agent"],
  ["Contact", "/contact"],
];

test("header has every nav link and Join", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  for (const [name, href] of NAV) await expect(header.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  await expect(header.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
  await expect(header.getByRole("link", { name: "Join the waitlist" })).toHaveAttribute("href", "/#waitlist");
  await expect(header.getByRole("link", { name: "OpsAgent" })).toHaveAttribute("href", "/");
});

test("current page is marked in the nav", async ({ page }) => {
  await page.goto("/docs/connect-your-agent");
  await expect(page.getByRole("banner").getByRole("link", { name: "Docs", exact: true })).toHaveAttribute("aria-current", "page");
});

test("mobile menu opens, Escape closes, focus returns", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("banner").getByRole("button", { name: /menu/i });
  const pricing = page.getByRole("banner").getByRole("link", { name: "Pricing", exact: true });
  await expect(pricing).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(pricing).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Join the waitlist" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(pricing).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.mouse.click(200, 700);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("no email address on home", async ({ page }) => {
  await page.goto("/");
  const html = await page.content();
  expect(html).not.toContain("info@opsagent.dev");
  expect(html).not.toContain("mailto:");
});
