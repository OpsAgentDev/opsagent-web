import { expect, test, type Page } from "@playwright/test";
import { signUp } from "./helpers";

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

test("a signed-out visit is remembered and the app returns to the invite after sign-in", async ({ page }) => {
  await mockSession(page, false);
  await page.goto("/invites/tok12345");
  await expect(page.getByText("only approved addresses can create a new account")).toBeVisible();
  await page.unroute("**/v1/auth/me");
  await mockSession(page); // now signed in
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [] }));
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/invites\/tok12345$/);
});

test("a full team gives the invitee no owner-only advice", async ({ page }) => {
  await mockSession(page);
  await page.route("**/v1/invites/full/accept", (r) => r.fulfill(problem(402, "plan_limit", "limit")));
  await page.goto("/invites/full");
  await page.getByRole("button", { name: "Accept invite" }).click();
  await expect(page.locator("main").getByRole("alert")).toHaveText(/Ask the owner/);
  await expect(page.getByText("Open Billing")).toHaveCount(0);
});

test("the wrong account can sign out from the invite page and from the header, and lands on the home page", async ({ page }) => {
  await mockSession(page);
  let outs = 0;
  await page.route("**/v1/auth/sign-out", (r) => { outs++; return r.fulfill({ status: 204 }); });
  await page.route("**/v1/invites/mine/accept", (r) => r.fulfill(problem(403, "invite_email_mismatch", "different")));
  await page.goto("/invites/mine");
  await page.getByRole("button", { name: "Accept invite" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("different email address");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(outs).toBe(1);
});

test("the header has Sign out on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page);
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [{ id: "o", name: "Acme", slug: "acme", timezone: "UTC", role: "owner", created_at: "2026-01-01T00:00:00Z" }] }));
  await page.route("**/v1/orgs/acme/members", (r) => r.fulfill({ json: [mine] }));
  await page.route("**/v1/orgs/acme/invites", (r) => r.fulfill({ json: [] }));
  await page.goto("/settings/members");
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});

test("after joining, the app opens the joined organisation", async ({ page }) => {
  await mockSession(page);
  await page.route("**/v1/invites/join1234/accept", (r) => r.fulfill({ json: { id: "e", name: "Team B", slug: "team-b", role: "member" } }));
  const org = (name: string, slug: string) => ({ id: slug, name, slug, timezone: "UTC", role: "member", created_at: "2026-01-01T00:00:00Z" });
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [org("Mine", "mine"), org("Team B", "team-b")] }));
  await page.goto("/invites/join1234");
  await page.getByRole("button", { name: "Accept invite" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByLabel("Organisation")).toHaveValue("team-b");
});

test("an expired or used invite says so in plain words", async ({ page }) => {
  await mockSession(page);
  await page.route("**/v1/invites/old/accept", (r) => r.fulfill(problem(410, "invite_invalid", "gone")));
  await page.goto("/invites/old");
  await page.getByRole("button", { name: "Accept invite" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("expired, was already used, or isn't valid");
});

test("an owner invites from Settings > Members on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page);
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [{ id: "o", name: "Acme", slug: "acme", timezone: "UTC", role: "owner", created_at: "2026-01-01T00:00:00Z" }] }));
  await page.route("**/v1/orgs/acme/members", (r) => r.fulfill({ json: [mine, other] }));
  await page.route("**/v1/orgs/acme/invites", (r) =>
    r.fulfill(r.request().method() === "POST" ? { status: 201, json: { id: "i", email: "new@example.com", role: "member", expires_at: "2026-12-01T00:00:00Z" } } : { json: [] }));
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
  await expect(page.locator("main").getByRole("alert")).toContainText("plan's member or integration limit");
  await page.getByRole("button", { name: `Remove ${other.email}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.getByText(other.email)).toHaveCount(0);
});

test("a rate-limit refusal shows no raw code", async ({ page }) => {
  await mockSession(page);
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [{ id: "o", name: "Acme", slug: "acme", timezone: "UTC", role: "owner", created_at: "2026-01-01T00:00:00Z" }] }));
  await page.route("**/v1/orgs/acme/members", (r) => r.fulfill({ json: [mine] }));
  await page.route("**/v1/orgs/acme/invites", (r) => r.fulfill(problem(429, "rate_limited", "Too many invites today. Try again tomorrow.")));
  await page.goto("/settings/members");
  await page.getByLabel("Email").fill("x@example.com");
  await page.getByRole("button", { name: "Send invite" }).click();
  await expect(page.locator("main").getByRole("alert")).toHaveText("Too many invites today. Try again tomorrow.");
});

test("a non-owner sees the list and no controls", async ({ page }) => {
  await mockSession(page);
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [{ id: "o", name: "Acme", slug: "acme", timezone: "UTC", role: "member", created_at: "2026-01-01T00:00:00Z" }] }));
  await page.route("**/v1/orgs/acme/members", (r) => r.fulfill({ json: [mine, other] }));
  await page.goto("/settings/members");
  await expect(page.getByText("Only an owner can invite people, change roles or remove anyone.")).toBeVisible();
  await expect(page.getByText(other.email)).toBeVisible();
  await expect(page.getByRole("button", { name: "Send invite" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Remove/ })).toHaveCount(0);
});

test("sign-out stays on the page and says so when the session was not ended", async ({ page, request }) => {
  await signUp(page, request);
  await page.route("**/v1/auth/sign-out", (r) => r.fulfill({ status: 500, json: { title: "x", status: 500 } }));
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page.getByText("Sign-out failed. Try again.").first()).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
});

const acme = { id: "o", name: "Acme", slug: "acme", timezone: "UTC", role: "owner", created_at: "2026-01-01T00:00:00Z" };

test("an owner sees pending invites and can cancel one", async ({ page }) => {
  await mockSession(page);
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [acme] }));
  await page.route("**/v1/orgs/acme/members", (r) => r.fulfill({ json: [mine, other] }));
  let invites = [{ id: "i1", email: "new@example.com", role: "member", expires_at: "2026-12-01T00:00:00Z", created_at: "2026-11-10T00:00:00Z" }];
  await page.route("**/v1/orgs/acme/invites", (r) => r.fulfill({ json: invites }));
  await page.route("**/v1/orgs/acme/invites/i1", (r) => { invites = []; return r.fulfill({ status: 204 }); });
  await page.goto("/settings/members");
  await expect(page.getByRole("heading", { name: "Pending invites" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel invite to new@example.com" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel invite" }).click();
  await expect(page.getByRole("heading", { name: "Pending invites" })).toHaveCount(0);
});

test("demoting the last owner is refused in plain words and the role stays", async ({ page }) => {
  await mockSession(page);
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [acme] }));
  const owner2 = { ...other, role: "owner" };
  await page.route("**/v1/orgs/acme/members", (r) => r.fulfill({ json: [mine, owner2] }));
  await page.route("**/v1/orgs/acme/invites", (r) => r.fulfill({ json: [] }));
  await page.route("**/v1/orgs/acme/members/*", (r) =>
    r.fulfill(problem(409, "last_owner", "An organisation must keep at least one owner.")));
  await page.goto("/settings/members");
  await page.getByLabel("Role for pat@example.com").selectOption("member");
  await expect(page.locator("main").getByText("An organisation must keep at least one owner.")).toBeVisible();
  await expect(page.getByLabel("Role for pat@example.com")).toHaveValue("owner");
});

test("a member sees no invites and no role controls", async ({ page }) => {
  await mockSession(page);
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [{ ...acme, role: "member" }] }));
  await page.route("**/v1/orgs/acme/members", (r) => r.fulfill({ json: [{ ...mine, role: "member" }, other] }));
  let asked = false;
  await page.route("**/v1/orgs/acme/invites", (r) => { asked = true; return r.fulfill({ json: [] }); });
  await page.goto("/settings/members");
  await expect(page.getByText("pat@example.com")).toBeVisible();
  await expect(page.getByLabel("Role for pat@example.com")).toHaveCount(0);
  expect(asked).toBe(false);
});

test("someone in two organisations can switch between them", async ({ page }) => {
  await mockSession(page);
  const org = (name: string, slug: string) => ({ ...acme, id: slug, name, slug });
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [org("Acme", "acme"), org("Team B", "team-b")] }));
  await page.goto("/dashboard");
  await expect(page.getByLabel("Organisation")).toHaveValue("acme");
  await page.getByLabel("Organisation").selectOption("team-b");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByLabel("Organisation")).toHaveValue("team-b");
});
