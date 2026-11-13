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
