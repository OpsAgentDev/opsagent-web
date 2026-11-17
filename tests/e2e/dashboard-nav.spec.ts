import { expect, test } from "@playwright/test";
import { connectNoisy, openUserMenu, signUp, sql } from "./helpers";

const GROUPS: [string | null, [string, string][]][] = [
  [null, [["Dashboard", "/dashboard"]]],
  ["Monitoring", [["Findings", "/findings"], ["Ask OpsAgent", "/chat"], ["Deliveries", "/deliveries"], ["Cloud accounts", "/connections"]]],
];
// Help opens the public pages as they are, outside the organisation.
const HELP: [string, string][] = [["Docs", "/docs/connect-your-agent"], ["Contact", "/contact"], ["Status", "/status"]];

test("app shell: sidebar with every link, current page marked, top bar, phone drawer opens and closes", async ({ page, request }) => {
  const email = await signUp(page, request);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/findings");
  const nav = page.getByRole("navigation", { name: "Main" });
  // Every link is addressed inside the organisation (/o/<slug>/…), each group under its own label.
  for (const [group, links] of GROUPS) {
    const within = group ? nav.getByRole("group", { name: group }) : nav;
    for (const [name, href] of links) await expect(within.getByRole("link", { name, exact: true })).toHaveAttribute("href", new RegExp(`^/o/e2e-\\d+${href}$`));
  }
  const help = nav.getByRole("group", { name: "Help" });
  for (const [name, href] of HELP) await expect(help.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  await expect(page).toHaveURL(/\/o\/e2e-\d+\/findings$/); // the old address was corrected
  await expect(nav.getByRole("link", { name: "Findings", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link")).toHaveCount(GROUPS.flatMap(([, l]) => l).length + HELP.length);
  for (const link of await nav.getByRole("link").all()) await expect(link.locator("svg")).toBeVisible(); // an icon on every link

  // Top bar: the organisation is a menu even with one organisation; the account email is in the person's row only; no Menu button on desktop.
  const bar = page.getByRole("banner");
  await expect(bar.getByText(/^E2E \d+$/)).toBeVisible();
  const orgButton = bar.getByRole("button", { name: /^Organisation:/ });
  await orgButton.click();
  await expect(orgButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("list", { name: "Organisations" }).getByRole("button")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Create organisation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(orgButton).toBeFocused();
  await expect(bar.getByText(email)).toHaveCount(0);
  await expect(page.locator(".user-row").getByText(email)).toBeVisible();
  const menu = bar.getByRole("button", { name: "Menu", exact: true });
  await expect(menu).toBeHidden();
  // The person's row at the foot opens a menu with their pages, the theme switch and Sign out; Escape closes it.
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
  await openUserMenu(page);
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  for (const [name, href] of [["Security", "/settings/security"], ["Account", "/settings/account"]]) {
    await expect(page.locator(".user-menu").getByRole("link", { name, exact: true })).toHaveAttribute("href", new RegExp(`^/o/e2e-\\d+${href}$`));
  }
  await expect(page.locator(".user-menu").getByRole("group", { name: "Theme" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);

  // A group folds under its label and stays folded after a reload; the page you are on stays listed.
  await page.goto("/dashboard");
  const monitoring = nav.getByRole("group", { name: "Monitoring" });
  await monitoring.getByRole("button", { name: "Monitoring" }).click();
  await expect(monitoring.getByRole("link")).toHaveCount(0);
  await page.reload();
  await expect(monitoring.getByRole("button", { name: "Monitoring" })).toHaveAttribute("aria-expanded", "false");
  await expect(monitoring.getByRole("link")).toHaveCount(0);
  await monitoring.getByRole("button", { name: "Monitoring" }).click();
  await expect(monitoring.getByRole("link")).toHaveCount(3);

  // Organisation settings open from the organisation menu: one page, each part a tab.
  await orgButton.click();
  await page.getByRole("link", { name: "Organisation settings" }).click();
  const tabs = page.getByRole("navigation", { name: "Organisation settings" });
  await expect(page).toHaveURL(/\/settings\/members$/);
  await tabs.getByRole("link", { name: "Billing", exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/billing$/);
  await expect(tabs.getByRole("link", { name: "Billing", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(tabs.getByRole("link")).toHaveCount(6);
  await expect(nav.getByRole("link", { name: "Findings", exact: true })).not.toHaveAttribute("aria-current");

  // The sidebar folds to its icons and back; the links keep their names and the choice survives a reload.
  const side = page.locator(".sidebar");
  expect((await side.boundingBox())!.width).toBeGreaterThan(200);
  await page.locator(".sidebar").getByRole("button", { name: "Collapse sidebar" }).click();
  expect((await side.boundingBox())!.width).toBeLessThan(70);
  await expect(nav.getByRole("link", { name: "Findings", exact: true })).toBeVisible();
  await page.reload();
  await expect(bar.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  expect((await side.boundingBox())!.width).toBeLessThan(70);
  await bar.getByRole("button", { name: "Expand sidebar" }).click();
  expect((await side.boundingBox())!.width).toBeGreaterThan(200);

  // Phone: the sidebar is a drawer.
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(nav).toBeHidden();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  for (const [name] of GROUPS.flatMap(([, l]) => l)) await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();

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

test("Cloud accounts lists the organisation's accounts; a removed one is marked and not offered as a filter", async ({ page, request }) => {
  await signUp(page, request);
  await page.goto("/connections");
  await expect(page.getByRole("heading", { name: "Cloud accounts", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Connect an account" }).click();
  await expect(page.getByText("Each cloud account is billed on your plan. The trial covers one.")).toBeVisible();

  const id = await connectNoisy(page);
  await page.goto("/connections");
  await expect(page.locator(".cards.accounts").getByText("noisy")).toBeVisible();
  await expect(page.getByRole("link", { name: "Connect another account" })).toBeVisible();

  sql(`UPDATE connections SET status = 'disconnected' WHERE id = '${id}'`);
  await page.goto("/deliveries");
  await expect(page.getByLabel("Connection").locator("option")).toHaveText(["all"]);
});
