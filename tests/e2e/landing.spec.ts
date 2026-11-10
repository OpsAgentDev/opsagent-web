import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

test("landing renders every section", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Your ops teammate that never sleeps." })).toBeVisible();
  await expect(page.getByText("Sample night")).toBeVisible();
  await expect(page.getByText("While you slept")).toBeVisible();
  for (const label of ["Overnight", "Night watch", "Morning briefing", "Urgent", "Everything"]) {
    await expect(page.getByRole("tab", { name: label })).toBeVisible();
  }
  await expect(page.locator("section#waitlist")).toHaveClass(/hero/);
  await expect(page.locator(".soon")).toHaveCount(1); // the mobile app only
  await expect(page.getByText("page you at 3am", { exact: false })).toHaveCount(0);
  for (const name of [
    /while you sleep/i,
    /how it works/i,
    /what it checks/i,
    /what it will never do/i,
    /ios and android/i,
    /bring your own ai/i,
    /get your ops teammate/i,
  ]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  await expect(page.locator("#how-it-works .soon")).toHaveCount(0);
  await expect(page.locator("#what-it-checks li")).toHaveCount(10);
  await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("landing fits a 320px phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your ops teammate that never sleeps." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("landing has no horizontal overflow at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator(".numbers").scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("number strip counts up to its final values", async ({ page }) => {
  await page.goto("/");
  const strip = page.locator(".numbers");
  await strip.scrollIntoViewIfNeeded();
  await expect(strip.locator("strong")).toHaveText(["15 min", "10", "0", "1"]);
  await expect(strip).toContainText("checks run every night");
});

test("with reduced motion every section shows without scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const sel of [".trust li", ".numbers li", "#how-it-works li", "#what-it-checks li", "#never li", ".phone-note", ".mcp-url code"]) {
    const items = page.locator(sel);
    for (let i = 0; i < (await items.count()); i++) {
      // Effective opacity: an ancestor at 0 hides the item too.
      const opacity = await items.nth(i).evaluate((e) => {
        let o = 1;
        for (let n: Element | null = e; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
        return o;
      });
      expect(opacity, `${sel} #${i}`).toBe(1);
    }
  }
  await expect(page.locator(".numbers strong").first()).toHaveText("15 min");
});

test("product shots are sized, described and labelled Sample", async ({ page }) => {
  await page.goto("/");
  const shots = page.locator("#product img");
  await expect(shots).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const img = shots.nth(i);
    await expect(img).toHaveAttribute("alt", /.{20,}/);
    await expect(img).toHaveAttribute("width", /^\d+$/);
    await expect(img).toHaveAttribute("height", /^\d+$/);
  }
  await expect(page.locator("#product").getByText("Sample data")).toHaveCount(3);
});

test("a section below the fold reveals once scrolled to", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const card = page.locator("#what-it-checks li").first();
  expect(await card.evaluate((e) => getComputedStyle(e).opacity)).toBe("0");
  await card.scrollIntoViewIfNeeded();
  await expect.poll(() => card.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
});

test("demo tabs show each panel", async ({ page }) => {
  await page.goto("/");
  const panel = page.getByRole("tabpanel");
  const cases: [string, string][] = [
    ["Overnight", "While you slept"],
    ["Night watch", "03:12"],
    ["Morning briefing", "Sample briefing"],
    ["Urgent", "Sample alert"],
    ["Urgent", "snapshot left public"],
    ["Everything", "Every finding names the resource"],
  ];
  for (const [tab, key] of cases) {
    await page.getByRole("tab", { name: tab }).click();
    await expect(panel.getByText(key, { exact: false }).first()).toBeVisible();
  }
});

test("demo advances by itself until clicked", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "Night watch" })).toHaveAttribute("aria-selected", "true", { timeout: 8000 });
  await page.getByRole("tab", { name: "Urgent" }).click();
  await page.waitForTimeout(7000);
  await expect(page.getByRole("tab", { name: "Urgent" })).toHaveAttribute("aria-selected", "true");
});

test("demo keyboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Overnight" }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Everything" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Overnight" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Overnight" })).toBeFocused();
});

test("demo respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForTimeout(7000);
  await expect(page.getByRole("tab", { name: "Overnight" })).toHaveAttribute("aria-selected", "true");
});

test("demo without JS", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByText("While you slept")).toBeVisible();
  await context.close();
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
  await expect(page.locator('[aria-live="polite"]').filter({ hasText: "Check your email to confirm your spot." })).toBeVisible();
  await expect(async () => {
    const res = await request.get(`${MAILPIT}/api/v1/search`, { params: { query: `to:"${email}"` } });
    const { messages } = (await res.json()) as { messages: { Subject: string }[] };
    expect(messages.map((m) => m.Subject)).toEqual(["Confirm your email for the OpsAgent waitlist"]);
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
  const ok = hero(page).getByText("Check your email to confirm your spot.");
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
  await expect(hero(page).getByLabel("Email address")).toHaveAccessibleDescription(/valid email.*one email to confirm/);
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

test("the emailed link confirms on a click, not on load", async ({ page }) => {
  let body: unknown = null;
  await page.route("**/v1/waitlist/verify", (r) => {
    body = r.request().postDataJSON();
    return r.fulfill({ status: 204 });
  });
  await page.goto("/waitlist/verify#tok-123");
  await expect(page).toHaveURL(/\/waitlist\/verify$/);
  expect(body).toBeNull();
  await page.getByRole("button", { name: "Confirm my email" }).click();
  await expect(page.getByRole("status")).toHaveText("You're on the list. We'll email you once when sign-ups open.");
  expect(body).toEqual({ token: "tok-123" });
});

test("a used confirmation link says so in plain words", async ({ page }) => {
  await page.route("**/v1/waitlist/verify", (r) =>
    r.fulfill({ status: 410, json: { type: "about:blank", title: "Gone", status: 410, code: "waitlist_link_invalid" } }));
  await page.goto("/waitlist/verify#old");
  await page.getByRole("button", { name: "Confirm my email" }).click();
  await expect(page.locator("main").getByText("This link was already used or isn't valid.")).toBeVisible();
});
