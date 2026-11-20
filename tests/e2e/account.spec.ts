import { expect, test, type Page } from "@playwright/test";

const me = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "boss@example.com", has_passkey: true, name: null, terms_accepted_at: "2026-01-01T00:00:00Z" };
const acme = { id: "o", name: "Acme", slug: "acme", timezone: "UTC", role: "owner", created_at: "2026-01-01T00:00:00Z" };
const problem = (status: number, code: string, detail: string) => ({ status, json: { type: "about:blank", title: code, status, detail, instance: "x", code } });

async function mock(page: Page, role = "owner") {
  await page.route("**/v1/auth/me", (r) =>
    r.request().method() === "DELETE" ? r.fallback() : r.fulfill({ json: me }));
  await page.route("**/v1/auth/csrf", (r) => r.fulfill({ json: { token: "t" } }));
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [{ ...acme, role }] }));
}

test("deleting the organisation needs its exact name", async ({ page }) => {
  await mock(page);
  let deleted = false;
  await page.route("**/v1/orgs/acme", (r) => {
    if (r.request().method() !== "DELETE") return r.fallback();
    deleted = true;
    return r.fulfill({ status: 204 });
  });
  await page.goto("/settings/account");
  await page.getByRole("button", { name: "Delete organisation" }).click();
  const dialog = page.getByRole("dialog");
  const go = dialog.getByRole("button", { name: "Delete organisation" });
  await dialog.getByLabel("Type the organisation's name to confirm").fill("acme");
  await expect(go).toBeDisabled();
  await dialog.getByLabel("Type the organisation's name to confirm").fill("Acme");
  await go.click();
  await expect.poll(() => deleted).toBe(true);
});

test("a member sees no organisation deletion", async ({ page }) => {
  await mock(page, "member");
  await page.goto("/settings/account");
  await expect(page.getByRole("heading", { name: "Delete my account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete organisation" })).toHaveCount(0);
});

test("the only owner is told why the account can't be deleted yet", async ({ page }) => {
  await mock(page);
  await page.route("**/v1/auth/me", (r) =>
    r.request().method() === "DELETE"
      ? r.fulfill(problem(409, "last_owner", "You are the only owner of Acme. Make someone else an owner, or delete the organisation, first."))
      : r.fallback());
  await page.goto("/settings/account");
  await page.getByRole("button", { name: "Delete my account" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Type your email address to confirm").fill("Boss@Example.com");
  await dialog.getByRole("button", { name: "Delete my account" }).click();
  await expect(dialog.getByText("You are the only owner of Acme.")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Go to Members" })).toBeVisible();
});

test("a deleted account lands on the home page", async ({ page }) => {
  await mock(page);
  await page.route("**/v1/auth/me", (r) => (r.request().method() === "DELETE" ? r.fulfill({ status: 204 }) : r.fallback()));
  await page.goto("/settings/account");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await page.getByRole("dialog").getByLabel("Type your email address to confirm").fill("boss@example.com");
  await page.getByRole("dialog").getByRole("button", { name: "Delete my account" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("your name is prefilled, saved through PATCH /auth/me, and a refusal shows brain's words", async ({ page }) => {
  await mock(page);
  let name: string | null = "Ada";
  const sent: unknown[] = [];
  let refuse = false;
  // Brain main may not have this route yet: the page's request is what is checked here.
  await page.route("**/v1/auth/me", (r) => {
    if (r.request().method() === "GET") return r.fulfill({ json: { ...me, name } });
    if (r.request().method() !== "PATCH") return r.fallback();
    sent.push(r.request().postDataJSON());
    if (refuse) return r.fulfill(problem(422, "invalid_name", "That name can't be used."));
    name = (r.request().postDataJSON() as { name: string }).name;
    return r.fulfill({ json: { ...me, name } });
  });
  await page.goto("/settings/account");
  const field = page.getByLabel("Your name");
  await expect(field).toHaveValue("Ada");
  await expect(page.getByText("Sign-in email: boss@example.com")).toBeVisible();
  await field.fill("  Ada Lovelace ");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Name saved.")).toBeVisible();
  expect(sent).toEqual([{ name: "Ada Lovelace" }]);
  // The account menu reads the session again and shows the new name.
  await page.getByRole("button", { name: /^Account: / }).click();
  await expect(page.locator("#user-menu").getByText("Ada Lovelace")).toBeVisible();
  await page.keyboard.press("Escape");
  refuse = true;
  await field.fill("Grace");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "That name can't be used." })).toBeVisible();
  await expect(page.getByText("Name saved.")).toHaveCount(0);
});

test("the sign-in email is changed with a code sent to the new address", async ({ page }) => {
  await mock(page);
  let email = me.email;
  const sent: unknown[] = [];
  let refuse: ReturnType<typeof problem> | null = problem(403, "fresh_sign_in_required", "Sign out and sign in again, then retry within 15 minutes.");
  // Brain main may not have these routes yet: the page's requests are what is checked here.
  await page.route("**/v1/auth/me", (r) => (r.request().method() === "GET" ? r.fulfill({ json: { ...me, email } }) : r.fallback()));
  await page.route("**/v1/auth/me/email", (r) => {
    sent.push(r.request().postDataJSON());
    return refuse ? r.fulfill(refuse) : r.fulfill({ status: 202 });
  });
  await page.route("**/v1/auth/me/email/confirm", (r) => {
    const { code } = r.request().postDataJSON() as { code: string };
    sent.push({ code });
    if (code !== "123456") return r.fulfill(problem(410, "code_invalid", "code_invalid"));
    email = "new@example.com";
    return r.fulfill({ json: { ...me, email } });
  });
  await page.goto("/settings/account");
  await expect(page.getByText("Sign-in email: boss@example.com")).toBeVisible();
  await expect(page.getByRole("link", { name: "contact form" })).toHaveCount(0);
  await page.getByRole("button", { name: "Change", exact: true }).click();
  await page.getByLabel("New sign-in email").fill(" New@Example.com ");
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "sign out and sign in again" })).toBeVisible();
  refuse = null;
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("We sent a code to New@Example.com.")).toBeVisible();
  await page.getByLabel("6-digit code").fill("000000");
  await expect(page.getByRole("alert").filter({ hasText: "That code didn't work." })).toBeVisible();
  await expect(page.getByLabel("6-digit code")).toHaveValue("");
  await page.getByLabel("6-digit code").fill("123 456");
  await expect(page.getByText("Sign-in email changed. Your other devices were signed out.")).toBeVisible();
  await expect(page.getByText("Sign-in email: new@example.com")).toBeVisible();
  expect(sent).toEqual([{ email: "New@Example.com" }, { email: "New@Example.com" }, { code: "000000" }, { code: "123456" }]);
});
