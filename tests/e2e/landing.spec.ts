import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

const H1 = "Your ops teammate that never sleeps.";

test("landing renders every section in story order", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: H1 })).toBeVisible();
  await expect(page.locator("section#waitlist")).toHaveClass(/hero/);
  await expect(page.locator("main h2")).toHaveText([
    "It finds what is wrong, and shows you why.",
    "Read-only, through a role you create.",
    "One briefing a morning. An alert only when it cannot wait.",
    "Your own AI agent can read the same findings.",
    "A flat price per cloud account.",
    "What happens to your data.",
    "Get your ops teammate.",
  ]);
  await expect(page.locator("#what-it-checks .lp-checks li")).toHaveCount(10);
  await expect(page.locator("#read-only .lp-steps li")).toHaveCount(3);
  await expect(page.locator(".soon")).toHaveCount(1); // the mobile app only
  await expect(page.getByText("page you at 3am", { exact: false })).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("sections link to their inner pages", async ({ page }) => {
  await page.goto("/");
  const main = page.locator("main");
  for (const [name, href] of [
    ["See what each check looks for", "/features/checks"],
    ["See how it works", "/how-it-works"],
    ["Security page", "/security"],
    ["More on alerts and briefings", "/features/alerts"],
    ["Connect your agent", "/docs/connect-your-agent"],
    ["See pricing", "/pricing"],
    ["About human review", "/features/ai-and-review"],
    ["Read the Security page", "/security"],
  ] as [string, string][]) {
    await expect(main.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
});

test("product visuals are drawn in HTML, described and labelled Sample", async ({ page }) => {
  await page.goto("/");
  const main = page.locator("main");
  await expect(main.locator("img")).toHaveCount(0);
  const briefing = main.getByRole("figure", { name: "Sample morning briefing in Slack" });
  await expect(briefing).toContainText("OpsAgent morning briefing");
  await expect(briefing).toContainText("New critical and high (3)");
  await expect(briefing).toContainText("Open now: 1 critical, 2 high, 3 medium, 0 low, 0 info");
  const findings = main.getByRole("figure", { name: /Sample findings list/ });
  await expect(findings.locator("ol > li")).toHaveCount(6);
  await expect(findings).toContainText("snapshot=true public=true");
  await expect(findings).toContainText("Next step");
  await expect(main.getByRole("figure", { name: "Sample urgent alert in Slack" })).toContainText("Urgent: Snapshot orders-db-2026-11-03 is public");
  const agent = main.getByRole("figure", { name: /Sample session/ });
  await expect(agent).toContainText("list_findings");
  await expect(main.locator(".lp-mcp code")).toHaveText("https://brain.opsagent.dev/mcp");
  const ledger = main.getByRole("figure", { name: "What the OpsAgent role can and cannot do" });
  await expect(ledger.locator("li.is-ok")).toHaveCount(2);
  await expect(ledger.locator("li.is-no")).toHaveCount(4);
  await expect(main.locator(".lp-sample")).toHaveCount(4);
});

test("pricing pointer shows the three plan prices", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#pricing .lp-plans dd")).toHaveText(["$99", "$299", "$599"]);
});

for (const width of [320, 390]) {
  test(`landing has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: H1 })).toBeVisible();
    await page.locator(".lp-closing").scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test("the page reads the same without JavaScript and with reduced motion", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce", baseURL });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: H1 })).toBeVisible();
  for (const sel of [".lp-slack", ".lp-findings", ".lp-ledger", ".lp-term"]) {
    for (const el of await page.locator(sel).all()) expect(await el.evaluate((e) => getComputedStyle(e).opacity), sel).toBe("1");
  }
  await context.close();
});

// The tabbed alert demo left the home page with the redesign; it lives on the alerts feature page.
const DEMO = "/features/alerts";

test("demo tabs show each panel", async ({ page }) => {
  await page.goto(DEMO);
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
  await page.goto(DEMO);
  await expect(page.getByRole("tab", { name: "Night watch" })).toHaveAttribute("aria-selected", "true", { timeout: 8000 });
  await page.getByRole("tab", { name: "Urgent" }).click();
  await page.waitForTimeout(7000);
  await expect(page.getByRole("tab", { name: "Urgent" })).toHaveAttribute("aria-selected", "true");
});

test("demo keyboard", async ({ page }) => {
  await page.goto(DEMO);
  await page.getByRole("tab", { name: "Overnight" }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Everything" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Overnight" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Overnight" })).toBeFocused();
});

test("demo respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(DEMO);
  await page.waitForTimeout(7000);
  await expect(page.getByRole("tab", { name: "Overnight" })).toHaveAttribute("aria-selected", "true");
});

test("demo without JS", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto(DEMO);
  await expect(page.getByText("While you slept")).toBeVisible();
  await context.close();
});

test("dashboard keeps its own styles", async ({ page, request }) => {
  await signUp(page, request);
  await page.goto("/dashboard");
  await expect(page.locator(".app .sidebar").getByRole("link", { name: "OpsAgent", exact: true })).toBeVisible();
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
