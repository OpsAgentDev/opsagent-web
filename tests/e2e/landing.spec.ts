import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("landing renders every section", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your cloud, checked every night." })).toBeVisible();
  await expect(page.getByText("Sample briefing")).toBeVisible();
  for (const name of [/how it works/i, /what it checks/i, /what it will never do/i, /bring your own ai/i]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  await expect(page.locator("#what-it-checks li")).toHaveCount(10);
  await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("landing fits a 360px phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your cloud, checked every night." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test("dashboard keeps its own styles", async ({ page, request }) => {
  await signUp(page, request);
  await page.goto("/dashboard");
  await expect(page.locator("header.bar").getByLabel("OpsAgent").first()).toBeVisible();
  expect(await page.evaluate(() => document.body.closest(".mkt") === null && !document.querySelector(".mkt"))).toBe(true);
});
