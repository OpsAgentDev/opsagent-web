import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

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

const hero = (page: import("@playwright/test").Page) => page.locator(".hero");

test("joining the waitlist shows success and sends one mail", async ({ page, request }) => {
  const email = `wl-${Date.now()}@example.com`;
  await page.goto("/");
  await hero(page).getByLabel("Email address").fill(email);
  const button = hero(page).getByRole("button", { name: "Join the waitlist" });
  await button.click();
  await expect(page.locator('[aria-live="polite"]').filter({ hasText: "You're on the list. We'll email you when your spot opens." })).toBeVisible();
  await expect(async () => {
    const res = await request.get(`${MAILPIT}/api/v1/search`, { params: { query: `to:"${email}"` } });
    const { messages } = (await res.json()) as { messages: { Subject: string }[] };
    expect(messages.map((m) => m.Subject)).toEqual(["You're on the OpsAgent waitlist"]);
  }).toPass({ timeout: 30_000 });
});

test("button stays focusable and aria-disabled while pending, success takes focus", async ({ page }) => {
  await page.route("**/v1/waitlist", async (route) => {
    await new Promise((r) => setTimeout(r, 800));
    await route.fulfill({ status: 202, body: "" });
  });
  await page.goto("/");
  const input = hero(page).getByLabel("Email address");
  await input.fill("pending@example.com");
  const button = hero(page).getByRole("button", { name: "Join the waitlist" });
  await button.click();
  await expect(button).toHaveAttribute("aria-disabled", "true");
  await expect(button).not.toHaveAttribute("disabled", /.*/);
  const ok = hero(page).getByText("You're on the list.");
  await expect(ok).toBeVisible();
  await expect(ok).toBeFocused();
});

test("invalid email shows a validation message", async ({ page }) => {
  const calls: string[] = [];
  page.on("request", (r) => r.url().includes("/v1/waitlist") && calls.push(r.url()));
  await page.goto("/");
  await hero(page).getByLabel("Email address").fill("nope");
  await hero(page).getByRole("button", { name: "Join the waitlist" }).click();
  await expect(hero(page).getByRole("alert")).toContainText("valid email");
  await expect(hero(page).getByLabel("Email address")).toHaveAttribute("aria-invalid", "true");
  await expect(hero(page).getByLabel("Email address")).toHaveAccessibleDescription(/valid email.*Alpha opens/);
  expect(calls).toEqual([]);
});

test("rate limited shows the wait message", async ({ page }) => {
  await page.route("**/v1/waitlist", (route) => route.fulfill({ status: 429, body: "{}" }));
  await page.goto("/");
  await hero(page).getByLabel("Email address").fill("a@example.com");
  await hero(page).getByRole("button", { name: "Join the waitlist" }).click();
  await expect(page.getByText("Too many tries. Please wait a minute and try again.")).toBeVisible();
});

test("server error shows the fallback", async ({ page }) => {
  await page.route("**/v1/waitlist", (route) => route.fulfill({ status: 500, body: "{}" }));
  await page.goto("/");
  await hero(page).getByLabel("Email address").fill("a@example.com");
  await hero(page).getByRole("button", { name: "Join the waitlist" }).click();
  await expect(page.getByText("Something went wrong. Please try again later.")).toBeVisible();
});
