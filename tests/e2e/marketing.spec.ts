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
  { path: "/features/alerts", h1: "Alerts and briefings", section: "Urgent alerts", title: "Cloud alerts in Slack and morning briefings · OpsAgent" },
  { path: "/features/checks", h1: "What it checks", section: "The ten checks", title: "Cloud checks: IAM, exposure, cost and backups · OpsAgent" },
  { path: "/features/agents", h1: "Connect your agent", section: "What your agent can do", title: "Cloud MCP server for Claude, Cursor and ChatGPT · OpsAgent" },
  { path: "/features/ai-and-review", h1: "Dashboard AI and human review", section: "Human review", title: "Dashboard AI and human review · OpsAgent" },
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
  for (const p of ["$99", "$299", "$599", "14-day free trial", "Prices in US dollars, plus tax where applicable."]) await expect(main).toContainText(p);
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

test("security lists what the role reads as a real list", async ({ page }) => {
  await page.goto("/security");
  const section = page.locator("main section").filter({ has: page.getByRole("heading", { name: /What it reads/ }) });
  const items = section.getByRole("list").getByRole("listitem");
  await expect(items).toHaveCount(8);
  await expect(items.first()).toHaveCSS("display", "list-item");
  await expect(section).toContainText("It cannot read object contents, database rows, secret or parameter values, log events or function code.");
  await expect(section).not.toContainText("opsagent:logs");
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
  for (const [name, href] of [...NAV, ["Privacy", "/privacy"], ["Terms", "/terms"], ["Status", "/status"], ["vs AWS DevOps Agent", "/compare/aws-devops-agent"], ["Sample report", "/sample-report"]] as [string, string][]) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
});

test("AWS DevOps Agent comparison is sourced, dated and in the sitemap", async ({ page, request }) => {
  const res = await page.goto("/compare/aws-devops-agent");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "OpsAgent and AWS DevOps Agent" })).toBeVisible();
  await expect(page.getByRole("table")).toContainText("US$0.0083 per agent-second");
  await expect(page.getByRole("table")).toContainText("Starter US$99, Team US$299, Scale US$599");
  await expect(page.getByRole("link", { name: "Source for Price" })).toHaveAttribute("href", "https://aws.amazon.com/devops-agent/pricing/");
  await expect(page.locator("main")).toContainText("As of 24 November 2026");
  await expect(page.getByRole("heading", { name: "What OpsAgent does not do" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Get your ops teammate." })).toBeVisible();
  await expect(page).toHaveTitle("AWS DevOps Agent alternative for small teams · OpsAgent");
  expect(await page.locator('script[type="application/ld+json"]').first().textContent()).toContain('"@type":"Product"');
  expect((await request.get("/compare/nope")).status()).toBe(404);
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/compare/aws-devops-agent");
});

test("sample report is labelled, anonymised, indexed and offers the trial", async ({ page, request }) => {
  const res = await page.goto("/sample-report");
  expect(res?.status()).toBe(200);
  const main = page.locator("main");
  await expect(page.getByRole("heading", { level: 1, name: "What an OpsAgent report looks like" })).toBeVisible();
  await expect(main.getByText("Anonymised from a real scan of our own AWS account. Identifiers changed.")).toBeVisible();
  await expect(main.getByRole("link", { name: "Start free trial" })).toHaveAttribute("href", "/sign-up?utm_source=sample-report");
  const text = await main.innerHTML();
  for (const leak of [/(?<!\d)(?!123456789012)\d{12}(?!\d)/, /\bi-[0-9a-f]{8,}/, /\bvol-[0-9a-f]{8,}/, /opsagent-/i, /binary/i]) expect(text).not.toMatch(leak);
  expect((await page.title()).length).toBeLessThanOrEqual(60);
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/sample-report");
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
    await expect(page).toHaveTitle(p.title);
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

test("the hero window appears on a short screen without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("/");
  // Under 30% of it is in view, so its live loop is paused; the window itself must still fade in.
  await expect(page.locator(".lp-dash")).toHaveCSS("opacity", "1");
});

test("the header and the hero offer the dashboard instead of Sign in to a signed-in visitor", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Sign in" })).toBeVisible();
  // A remembered organisation alone is not enough: only the session check decides.
  await page.evaluate(() => localStorage.setItem("opsagent.org", "acme"));
  await page.reload();
  await expect(header.getByRole("link", { name: "Sign in" })).toBeVisible();
  await page.route("**/v1/auth/me", (r) => r.fulfill({ json: { id: "a", email: "a@example.com", has_passkey: true, name: null } }));
  await page.reload();
  await expect(header.getByRole("link", { name: "Open dashboard" })).toHaveAttribute("href", "/o/acme/dashboard");
  await expect(header.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await expect(page.locator("main").getByRole("link", { name: "Open dashboard" }).first()).toHaveAttribute("href", "/o/acme/dashboard");
  // Signed in without a remembered organisation: the plain dashboard address.
  await page.evaluate(() => localStorage.removeItem("opsagent.org"));
  await page.reload();
  await expect(header.getByRole("link", { name: "Open dashboard" })).toHaveAttribute("href", "/dashboard");
});

test("/docs redirects permanently to the docs page", async ({ request }) => {
  const res = await request.get("/docs", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers().location).toBe("/docs/connect-your-agent");
});
