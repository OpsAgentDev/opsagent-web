import { expect, test, type Page } from "@playwright/test";

const me = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "boss@example.com", has_passkey: true, name: null };
const other = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", user_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", email: "pat@example.com", name: null, role: "member" };
const mine = { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", user_id: me.id, email: me.email, name: null, role: "owner" };
const problem = (status: number, code: string, detail: string) => ({ status, json: { type: "about:blank", title: code, status, detail, instance: "x", code } });

async function mockSession(page: Page, signedIn = true) {
  await page.route("**/v1/auth/me", (r) => r.fulfill(signedIn ? { json: me } : problem(401, "unauthenticated", "Sign in")));
  await page.route("**/v1/auth/csrf", (r) => r.fulfill({ json: { token: "t" } }));
}

test("a signed-in person accepts an invite and lands on the dashboard", async ({ page }) => {
  await mockSession(page);
  await page.route("**/v1/invites/tok123/accept", (r) => r.fulfill({ json: { id: "e", name: "Acme", slug: "acme", role: "member" } }));
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [] }));
  await page.goto("/invites/tok123");
  await page.getByRole("button", { name: "Accept invite" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("a signed-out person is sent through sign-in and back", async ({ page }) => {
  await mockSession(page, false);
  await page.goto("/invites/tok123");
  await expect(page.getByRole("link", { name: "Sign in to accept" })).toHaveAttribute("href", "/sign-in?return_to=%2Finvites%2Ftok123");
});

test("an expired or used invite says so in plain words", async ({ page }) => {
  await mockSession(page);
  await page.route("**/v1/invites/old/accept", (r) => r.fulfill(problem(410, "invite_invalid", "gone")));
  await page.goto("/invites/old");
  await page.getByRole("button", { name: "Accept invite" }).click();
  await expect(page.getByRole("alert")).toContainText("expired, was already used, or isn't valid");
});

test("an owner invites from Settings > Members on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page);
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [{ id: "o", name: "Acme", slug: "acme", timezone: "UTC", role: "owner", created_at: "2026-01-01T00:00:00Z" }] }));
  await page.route("**/v1/orgs/acme/members", (r) => r.fulfill({ json: [mine, other] }));
  await page.route("**/v1/orgs/acme/invites", (r) => r.fulfill({ status: 201, json: { id: "i", email: "new@example.com", role: "member", expires_at: "2026-12-01T00:00:00Z" } }));
  await page.goto("/settings/members");
  await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
  await page.getByLabel("Email").fill("new@example.com");
  await page.getByRole("button", { name: "Send invite" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Invite sent to new@example.com as member" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("an owner confirms before removing a member; a plan limit reads in words", async ({ page }) => {
  await mockSession(page);
  let members = [mine, other];
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [{ id: "o", name: "Acme", slug: "acme", timezone: "UTC", role: "owner", created_at: "2026-01-01T00:00:00Z" }] }));
  await page.route("**/v1/orgs/acme/members", (r) => r.fulfill({ json: members }));
  await page.route(`**/v1/orgs/acme/members/${other.id}`, (r) => {
    members = [mine];
    return r.fulfill({ status: 204 });
  });
  await page.route("**/v1/orgs/acme/invites", (r) => r.fulfill(problem(402, "plan_limit", "limit")));
  await page.goto("/settings/members");
  await expect(page.getByRole("button", { name: `Remove ${mine.email}` })).toHaveCount(0);
  await page.getByLabel("Email").fill("x@example.com");
  await page.getByRole("button", { name: "Send invite" }).click();
  await expect(page.getByRole("alert")).toContainText("plan's member or integration limit");
  await page.getByRole("button", { name: `Remove ${other.email}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.getByText(other.email)).toHaveCount(0);
});

test("a non-owner sees the list and no controls", async ({ page }) => {
  await mockSession(page);
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [{ id: "o", name: "Acme", slug: "acme", timezone: "UTC", role: "member", created_at: "2026-01-01T00:00:00Z" }] }));
  await page.route("**/v1/orgs/acme/members", (r) => r.fulfill({ json: [mine, other] }));
  await page.goto("/settings/members");
  await expect(page.getByText("Only an owner can invite or remove people.")).toBeVisible();
  await expect(page.getByText(other.email)).toBeVisible();
  await expect(page.getByRole("button", { name: "Send invite" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Remove/ })).toHaveCount(0);
});
