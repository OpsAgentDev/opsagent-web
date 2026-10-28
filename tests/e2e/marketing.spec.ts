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

test("mobile menu closes after tapping a same-page anchor", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const header = page.getByRole("banner");
  await header.getByRole("button", { name: /menu/i }).click();
  await header.getByRole("link", { name: "Join the waitlist" }).click();
  await expect(header.getByRole("link", { name: "Pricing", exact: true })).toBeHidden();
});

test("no email address on marketing pages", async ({ page }) => {
  for (const path of ["/", "/how-it-works", "/security", "/pricing", "/contact", "/docs/connect-your-agent", "/privacy", "/terms", "/sign-in", "/sign-up"]) {
    await page.goto(path);
    const html = await page.content();
    expect(html, path).not.toContain("info@opsagent.dev");
    expect(html, path).not.toContain("mailto:");
  }
});

async function fillContact(page: import("@playwright/test").Page) {
  await page.getByLabel("Name").fill("Ada");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Message").fill("Hello, I have a question.");
}

test("contact form sends and shows success", async ({ page }) => {
  let body: Record<string, string> = {};
  await page.route("**/v1/contact", async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 202, contentType: "application/json", body: "{}" });
  });
  await page.goto("/contact?topic=security");
  await expect(page.getByLabel("Topic")).toHaveValue("security");
  await fillContact(page);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Thanks. We'll reply to you by email.")).toBeFocused();
  expect(body.topic).toBe("security");
  expect(body.message).toContain("Hello");
});

test("contact shows rate-limit message on 429", async ({ page }) => {
  await page.route("**/v1/contact", (route) => route.fulfill({ status: 429, contentType: "application/json", body: "{}" }));
  await page.goto("/contact?topic=bogus");
  await expect(page.getByLabel("Topic")).toHaveValue("general");
  await fillContact(page);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Too many messages" })).toBeVisible();
});

test("how-it-works renders five steps", async ({ page }) => {
  await page.goto("/how-it-works");
  await expect(page.locator("main h2")).toHaveCount(5);
  expect(await page.locator("main .soon").count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByRole("link", { name: /connect your agent/i })).toHaveAttribute("href", "/docs/connect-your-agent");
});

test("security renders and links contact for reports", async ({ page }) => {
  await page.goto("/security");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("main").getByRole("link", { name: /contact form/i })).toHaveAttribute("href", "/contact?topic=security");
});

test("pricing shows three plans with exact prices", async ({ page }) => {
  await page.goto("/pricing");
  const main = page.locator("main");
  for (const p of ["$99", "$299", "$599", "14-day free trial"]) await expect(main).toContainText(p);
  await expect(main.getByRole("link", { name: "Join the waitlist" })).toHaveCount(3);
  await expect(main.getByRole("link", { name: "Join the waitlist" }).first()).toHaveAttribute("href", "/#waitlist");
});
