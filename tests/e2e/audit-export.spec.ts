import { expect, test, type Page } from "@playwright/test";

const me = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "boss@example.com", has_passkey: true, name: null, terms_accepted_at: "2026-01-01T00:00:00Z" };
const acme = { id: "o", name: "Acme", slug: "acme", timezone: "UTC", role: "owner", created_at: "2026-01-01T00:00:00Z" };
const problem = (status: number, code: string, detail: string) => ({ status, json: { type: "about:blank", title: code, status, detail, instance: "x", code } });
const entry = (id: string, action: string, over: object = {}) => ({
  id, at: "2026-11-20T10:00:00Z", actor_type: "member", actor: "Ada (boss@example.com)", action,
  target_type: "connection", target: "Production", outcome: "success", metadata: {}, ...over,
});

// Brain main may not have these routes yet: every brain call is answered here.
async function mock(page: Page, role = "owner") {
  await page.route("**/v1/auth/me", (r) => r.fulfill({ json: me }));
  await page.route("**/v1/auth/csrf", (r) => r.fulfill({ json: { token: "t" } }));
  await page.route("**/v1/orgs", (r) => r.fulfill({ json: [{ ...acme, role }] }));
}

test("an owner reads the audit log and loads more", async ({ page }) => {
  await mock(page);
  await page.route("**/v1/orgs/acme/audit**", (r) => {
    const cursor = new URL(r.request().url()).searchParams.get("cursor");
    if (cursor === "c2") return r.fulfill({ json: { items: [entry("3", "brand.new_code", { actor: "OpsAgent", target: null })], next_cursor: null } });
    return r.fulfill({ json: { items: [entry("1", "connection.create"), entry("2", "mcp.tool.call", { actor: "agent Claude", target: null, target_type: null })], next_cursor: "c2" } });
  });
  await page.goto("/settings/audit");
  await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Organisation settings" }).getByRole("link", { name: "Audit log" })).toHaveAttribute("aria-current", "page");
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("Ada (boss@example.com)");
  await expect(rows.nth(0)).toContainText("Added a cloud account");
  await expect(rows.nth(0)).toContainText("Production");
  await expect(rows.nth(1)).toContainText("agent Claude");
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(rows).toHaveCount(3);
  // An unknown code is shown as it is; a target without a name shows its kind.
  await expect(rows.nth(2)).toContainText("brand.new_code");
  await expect(rows.nth(2)).toContainText("Cloud account");
  await expect(page.getByRole("button", { name: "Load more" })).toHaveCount(0);
});

test("an empty audit log says so", async ({ page }) => {
  await mock(page);
  await page.route("**/v1/orgs/acme/audit**", (r) => r.fulfill({ json: { items: [], next_cursor: null } }));
  await page.goto("/settings/audit");
  await expect(page.getByText("Nothing has been recorded yet.")).toBeVisible();
});

test("a member has no audit log tab and no export", async ({ page }) => {
  await mock(page, "member");
  let asked = false;
  await page.route("**/v1/orgs/acme/audit**", (r) => { asked = true; return r.fulfill(problem(403, "forbidden", "Owner role required.")); });
  await page.goto("/settings/audit");
  const tabs = page.getByRole("navigation", { name: "Organisation settings" });
  await expect(tabs.getByRole("link", { name: "Members" })).toBeVisible();
  await expect(tabs.getByRole("link", { name: "Audit log" })).toHaveCount(0);
  await expect(page.getByText("Only an owner can read the audit log.")).toBeVisible();
  expect(asked).toBe(false);
  await page.goto("/settings/account");
  await expect(page.getByRole("heading", { name: "Delete my account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download JSON" })).toHaveCount(0);
});

test("an owner downloads the export, and a second try within the hour shows why it was refused", async ({ page }) => {
  await mock(page);
  let calls = 0;
  await page.route("**/v1/orgs/acme/export", (r) => {
    calls += 1;
    expect(r.request().method()).toBe("POST");
    expect(r.request().headers()["x-csrf-token"]).toBe("t");
    if (calls > 1) return r.fulfill(problem(429, "rate_limited", "An organisation's data can be exported once per hour."));
    return r.fulfill({ contentType: "application/json", body: JSON.stringify({ organisation: { slug: "acme" } }) });
  });
  await page.goto("/settings/account");
  await expect(page.getByRole("heading", { name: "Export your data" })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  expect((await download).suggestedFilename()).toBe("opsagent-export-acme.json");
  await page.getByRole("button", { name: "Download JSON" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "An organisation's data can be exported once per hour." })).toBeVisible();
});
