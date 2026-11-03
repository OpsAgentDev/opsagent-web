import { expect, test, type Page } from "@playwright/test";
import { connectNoisy, signUp } from "./helpers";

// e2e brain has a Stripe key but no Stripe, so the POST is stubbed with a checkout URL and Stripe itself is stubbed.
async function stubPayment(page: Page) {
  await page.route("**/v1/orgs/*/human-reviews", (r) =>
    r.request().method() === "POST"
      ? r.fulfill({ status: 201, json: { id: "00000000-0000-0000-0000-000000000000", checkout_url: "https://checkout.stripe.com/c/pay/e2e" } })
      : r.fallback(),
  );
  await page.route("https://checkout.stripe.com/**", (r) => r.fulfill({ contentType: "text/html", body: "stripe stub" }));
}

test("owner requests an account review and sees it listed", async ({ page, request }) => {
  await signUp(page, request);
  await connectNoisy(page);
  await page.goto("/settings/human-review");
  await expect(page.getByRole("heading", { name: "Human review" })).toBeVisible();
  await expect(page.getByText("$499")).toBeVisible();
  await stubPayment(page);
  await page.getByLabel("Note").fill("Please look at networking first.");
  await page.getByRole("button", { name: "Request review" }).click();
  await expect(page).toHaveURL(/^https:\/\/checkout\.stripe\.com\//);
  await page.goto("/settings/human-review?paid=1");
  await expect(page.getByText("Payment received. Harun will reply within 1 business day.")).toBeVisible();
});

test("owner requests a review from a finding page", async ({ page, request }) => {
  await signUp(page, request);
  await connectNoisy(page);
  await page.goto("/findings");
  await expect(async () => {
    await page.reload();
    await expect(page.locator("tbody tr a").first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 60_000 });
  await page.locator("tbody tr a").first().click();
  await page.getByRole("button", { name: "Get a human review · $99" }).click();
  await stubPayment(page);
  await page.getByLabel("Note").fill("Fix this first.");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page).toHaveURL(/^https:\/\/checkout\.stripe\.com\//);
});
