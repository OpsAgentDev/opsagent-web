import { expect, test } from "@playwright/test";

const FEATURES: [string, string][] = [
  ["How it works", "/how-it-works"],
  ["Alerts and briefings", "/features/alerts"],
  ["What it checks", "/features/checks"],
  ["Connect your agent", "/features/agents"],
  ["Dashboard AI and human review", "/features/ai-and-review"],
];
const LINKS: [string, string][] = [
  ["Security", "/security"],
  ["Pricing", "/pricing"],
  ["Docs", "/docs/connect-your-agent"],
  ["Contact", "/contact"],
];
const NAV = [...FEATURES, ...LINKS];
const FEATURE_PAGES = [
  { path: "/features/alerts", h1: "Alerts and briefings", section: "Urgent alerts" },
  { path: "/features/checks", h1: "What it checks", section: "The ten checks" },
  { path: "/features/agents", h1: "Connect your agent", section: "What your agent can read" },
  { path: "/features/ai-and-review", h1: "Dashboard AI and human review", section: "Human review" },
];

test("header has every nav link and Join", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  for (const [name, href] of NAV) await expect(header.getByRole("link", { name, exact: true, includeHidden: true })).toHaveAttribute("href", href);
  await expect(header.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
  await expect(header.getByRole("link", { name: "Join the waitlist" })).toHaveAttribute("href", "/#waitlist");
  await expect(header.getByRole("link", { name: "OpsAgent" })).toHaveAttribute("href", "/");
});

test("current page is marked in the nav", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/docs/connect-your-agent");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Docs", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(header.getByRole("button", { name: /Features/ })).not.toHaveAttribute("aria-current");
  await page.goto("/features/checks");
  await expect(header.getByRole("link", { name: "What it checks", exact: true, includeHidden: true })).toHaveAttribute("aria-current", "page");
  await expect(header.getByRole("button", { name: /Features/ })).toHaveAttribute("aria-current", "true");
  await expect(header.getByRole("link", { name: "Docs", exact: true })).not.toHaveAttribute("aria-current");
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

test("phone menu lists the five feature pages under a Features label", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const header = page.getByRole("banner");
  await header.getByRole("button", { name: /menu/i }).click();
  await expect(header.getByText("Features", { exact: true })).toBeVisible();
  for (const [name, href] of NAV) {
    const link = header.getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", href);
  }
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
  for (const path of ["/", "/how-it-works", ...FEATURE_PAGES.map((p) => p.path), "/security", "/pricing", "/contact", "/docs/connect-your-agent", "/privacy", "/terms", "/sign-in", "/sign-up", "/sign-in/email", "/sign-up/email"]) {
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
  await expect(page.locator("main .soon")).toHaveCount(0);
  await expect(page.locator("main").getByRole("link", { name: /connect your agent/i })).toHaveAttribute("href", "/docs/connect-your-agent");
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

const URGENT = "Checks for urgent exposures every 15 minutes, day and night, and alerts you right away. Everything else waits for the morning briefing.";

test("marketing pages no longer say coming soon except for the mobile app", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(URGENT).first()).toBeVisible();
  const soon = page.locator("main .soon");
  await expect(soon).toHaveCount(1);
  await expect(page.locator(".mobile-strip .soon")).toHaveCount(1);
  await page.goto("/how-it-works");
  await expect(page.getByText(URGENT).first()).toBeVisible();
  await page.goto("/security");
  await expect(page.getByText("Watch scans read the same read-only data as the nightly scan, every 15 minutes, and never change anything.")).toBeVisible();
});

test("Features dropdown holds the five pages; Docs and Contact are plain links; Escape closes it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const header = page.getByRole("banner");
  const more = header.getByRole("button", { name: /Features/ });
  for (const [name] of LINKS) await expect(header.getByRole("link", { name, exact: true })).toBeVisible();
  await expect(header.getByRole("button", { name: /Resources/ })).toHaveCount(0);
  for (const [name] of FEATURES) await expect(header.getByRole("link", { name, exact: true })).toBeHidden();
  await more.click();
  await expect(more).toHaveAttribute("aria-expanded", "true");
  const panel = header.locator("#site-more");
  for (const [name, href] of FEATURES) await expect(panel.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  for (const [name] of FEATURES) await expect(panel.getByRole("link", { name, exact: true })).toBeVisible();
  await expect(panel.getByRole("link")).toHaveCount(5);
  await page.keyboard.press("Escape");
  await expect(panel.getByRole("link", { name: "What it checks" })).toBeHidden();
  await expect(more).toBeFocused();
});

test("pricing marks Team with the 14-day free trial badge", async ({ page }) => {
  await page.goto("/pricing");
  const team = page.locator("main .plans > li").filter({ has: page.getByRole("heading", { name: "Team" }) });
  await expect(team.locator(".plan-badge")).toHaveText("14-day free trial");
  await expect(page.locator("main .plan-badge")).toHaveCount(1);
});

test("security lists the three scoped reads as a real list", async ({ page }) => {
  await page.goto("/security");
  const section = page.locator("main section").filter({ has: page.getByRole("heading", { name: /What it reads/ }) });
  const items = section.getByRole("list").getByRole("listitem");
  await expect(items).toHaveCount(3);
  await expect(items.first()).toHaveCSS("display", "list-item");
  await expect(items.nth(1).locator("code")).toHaveText("opsagent:logs=allow");
});

test("docs Copy writes the MCP URL to the clipboard and says Copied", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/docs/connect-your-agent");
  await page.getByRole("button", { name: "Copy MCP URL" }).click();
  await expect(page.getByText("Copied", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://brain.opsagent.dev/mcp");
});

test("Features dropdown opens on hover and closes when the pointer leaves", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const header = page.getByRole("banner");
  const alerts = header.getByRole("link", { name: "Alerts and briefings", exact: true });
  await header.getByRole("button", { name: /Features/ }).hover();
  await expect(alerts).toBeVisible();
  await alerts.hover(); // crossing into the panel keeps it open
  await expect(alerts).toBeVisible();
  await page.mouse.move(600, 500);
  await expect(alerts).toBeHidden();
});

test("footer links to every public page", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  for (const [name, href] of [...NAV, ["Privacy", "/privacy"], ["Terms", "/terms"], ["Status", "/status"]] as [string, string][]) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
});

test("status page lists the API, MCP, scans and deliveries", async ({ page }) => {
  await page.goto("/status");
  await expect(page.getByRole("heading", { level: 1, name: "Status" })).toBeVisible();
  for (const name of ["API", "MCP", "Scans", "Deliveries"]) {
    await expect(page.locator(".status-list strong", { hasText: name })).toHaveCount(1);
  }
  await expect(page).toHaveTitle("Status · OpsAgent");
});

for (const p of FEATURE_PAGES) {
  test(`feature page ${p.path} renders its title, a key section and the call to action`, async ({ page }) => {
    await page.goto(p.path);
    const main = page.locator("main");
    await expect(page.getByRole("heading", { level: 1, name: p.h1 })).toBeVisible();
    await expect(main.getByRole("heading", { name: p.section, exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "Get your ops teammate." })).toBeVisible();
    await expect(main.getByRole("button", { name: "Join the waitlist" })).toBeVisible();
    await expect(page).toHaveTitle(`${p.h1} · OpsAgent`);
  });
}

test("feature pages make no forbidden claims and use no gradients or outbound reviewer links", async ({ page }) => {
  for (const p of FEATURE_PAGES) {
    await page.goto(p.path);
    const html = (await page.locator("main").innerHTML()).toLowerCase();
    for (const bad of ["harun.dev", "gradient", "auto-fix", "paging"]) expect(html, `${p.path}: ${bad}`).not.toContain(bad);
    const gradients = await page.evaluate(() =>
      // Buttons carry a soft sheen since the depth pass; nothing else on a feature page is a gradient.
      [...document.querySelectorAll("main *:not(button):not(a)")].filter((el) => getComputedStyle(el).backgroundImage.includes("gradient")).length,
    );
    expect(gradients, p.path).toBe(0);
  }
});

test("checks page lists all ten checks with evidence and when they run", async ({ page }) => {
  await page.goto("/features/checks");
  const cards = page.locator("main .check-cards > li");
  await expect(cards).toHaveCount(10);
  for (const i of [0, 9]) {
    await expect(cards.nth(i).getByText("Evidence", { exact: true })).toBeVisible();
    await expect(cards.nth(i).getByText("Runs", { exact: true })).toBeVisible();
  }
});

test("agents feature page copies the MCP URL and links the setup docs", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/features/agents");
  await page.getByRole("button", { name: "Copy MCP URL" }).click();
  await expect(page.getByText("Copied", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://brain.opsagent.dev/mcp");
  await expect(page.locator("main").getByRole("link", { name: /Set it up/ })).toHaveAttribute("href", "/docs/connect-your-agent");
});
