import { expect, test, type Page } from "@playwright/test";
import { signUp, sql } from "./helpers";

/** Seeds the newest organisation's billing columns (webhooks write them in production). */
function seed(status: string, extra = "") {
  sql(
    `UPDATE organisations SET billing_status = '${status}', stripe_subscription_id = 'sub_e2e', billing_tier = 'team',
     billing_quantity = 3 ${extra} WHERE id = (SELECT id FROM organisations ORDER BY created_at DESC LIMIT 1)`,
  );
}

const stubCheckout = (page: Page, url: string) =>
  page.route("**/v1/orgs/*/billing/checkout", (r) => r.fulfill({ json: { url } }));

test("billing page shows none state with Start free trial", async ({ page, request }) => {
  await signUp(page, request);
  await page.goto("/settings/billing");
  await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Manage billing" })).toHaveCount(0);
  await stubCheckout(page, "https://checkout.stripe.com/c/pay/e2e");
  await page.route("https://checkout.stripe.com/**", (r) => r.fulfill({ contentType: "text/html", body: "stripe stub" }));
  await page.getByRole("button", { name: "Start free trial" }).click();
  await expect(page).toHaveURL(/^https:\/\/checkout\.stripe\.com\//);
});

test("checkout refuses a redirect to another host", async ({ page, request }) => {
  await signUp(page, request);
  await page.goto("/settings/billing");
  await stubCheckout(page, "https://evil.example/pay");
  await page.getByRole("button", { name: "Start free trial" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/settings\/billing$/);
});

test("trialing shows days left, connections line and Manage billing", async ({ page, request }) => {
  await signUp(page, request);
  seed("trialing", ", trial_ends_at = now() + interval '9 days 12 hours', current_period_end = now() + interval '10 days'");
  await page.goto("/settings/billing");
  await expect(page.getByText("Trial: 10 days left")).toBeVisible();
  await expect(page.getByText("3 cloud accounts billed on Team")).toBeVisible();
  await expect(page.getByText("1,000 AI credits per cloud account each period")).toBeVisible();
  await expect(page.getByRole("button", { name: "Manage billing" })).toBeVisible();
});

test("past_due banner shows", async ({ page, request }) => {
  await signUp(page, request);
  seed("past_due", ", past_due_since = now()");
  await page.goto("/dashboard");
  const banner = page.getByText("Your last payment failed. Update your card to keep OpsAgent running.");
  await expect(banner).toBeVisible();
  await expect(page.getByRole("link", { name: "Manage billing" }).first()).toBeVisible();
});

test("billing not set up shows a neutral line", async ({ page, request }) => {
  await signUp(page, request);
  await page.route("**/v1/orgs/*/billing", (r) =>
    r.fulfill({ status: 503, contentType: "application/problem+json", json: { code: "billing_unavailable", title: "x", status: 503 } }));
  await page.goto("/settings/billing");
  await expect(page.getByText("Billing isn't set up yet.")).toBeVisible();
  await expect(page.locator("main").getByRole("button")).toHaveCount(0);
});

test("connect AWS redirects to billing when enforced and none", async ({ page, request }) => {
  await signUp(page, request);
  await page.route("**/v1/orgs/*/billing", (r) =>
    r.fulfill({ json: { status: "none", enforced: true, over_limit: false, quantity: 0 } }));
  await page.goto("/onboarding/connect-aws");
  await expect(page).toHaveURL(/\/settings\/billing$/);
});
