import { expect, test } from "@playwright/test";
import { openUserMenu, signUp } from "./helpers";

const GROUPS: [string | null, [string, string][]][] = [
  [null, [["Dashboard", "/dashboard"]]],
  ["Monitoring", [["Findings", "/findings"], ["Ask OpsAgent", "/chat"], ["Deliveries", "/deliveries"]]],
  ["Organisation", [
    ["Members", "/settings/members"], ["Billing", "/settings/billing"], ["Delivery settings", "/settings/delivery"],
    ["Connected agents", "/settings/agents"], ["AI", "/settings/ai"], ["Human review", "/settings/human-review"],
  ]],
  ["Profile", [["Security", "/settings/security"], ["Account", "/settings/account"]]],
];

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
  await expect(page).toHaveURL(/\/o\/e2e-\d+\/findings$/); // the old address was corrected
  await expect(nav.getByRole("link", { name: "Findings", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link")).toHaveCount(GROUPS.flatMap(([, l]) => l).length);
  for (const link of await nav.getByRole("link").all()) await expect(link.locator("svg")).toBeVisible(); // an icon on every link

  // Top bar: the organisation as plain text (one organisation), the account email; no Menu button on desktop.
  const bar = page.getByRole("banner");
  await expect(bar.getByText(/^E2E \d+$/)).toBeVisible();
  await expect(bar.getByRole("button", { name: /^Organisation:/ })).toHaveCount(0);
  await expect(bar.getByText(email)).toBeVisible();
  const menu = bar.getByRole("button", { name: "Menu", exact: true });
  await expect(menu).toBeHidden();
  // The person's row at the foot opens a menu with the theme switch and Sign out; Escape closes it.
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
  await openUserMenu(page);
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(page.locator(".user-menu").getByRole("group", { name: "Theme" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);

  // A group folds under its label and stays folded after a reload; the page you are on stays listed.
  const profile = nav.getByRole("group", { name: "Profile" });
  await profile.getByRole("button", { name: "Profile" }).click();
  await expect(profile.getByRole("link")).toHaveCount(0);
  await page.reload();
  await expect(profile.getByRole("button", { name: "Profile" })).toHaveAttribute("aria-expanded", "false");
  await expect(profile.getByRole("link")).toHaveCount(0);
  await profile.getByRole("button", { name: "Profile" }).click();
  await expect(profile.getByRole("link")).toHaveCount(2);

  await nav.getByRole("link", { name: "Billing", exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/billing$/);
  await expect(nav.getByRole("link", { name: "Billing", exact: true })).toHaveAttribute("aria-current", "page");
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
