import { expect, test } from "@playwright/test";
import { connectNoisy, signUp } from "./helpers";

test("owner requests an account review and sees it listed", async ({ page, request }) => {
  await signUp(page, request);
  await connectNoisy(page);
  await page.goto("/settings/human-review");
  await expect(page.getByRole("heading", { name: "Human review" })).toBeVisible();
  await expect(page.getByText("$499")).toBeVisible();
  await page.getByLabel("Note").fill("Please look at networking first.");
  await page.getByRole("button", { name: "Request review" }).click();
  await expect(page.getByText("Request sent. Harun will reply within 1 business day.")).toBeVisible();
  const row = page.getByRole("row", { name: /Account review.*noisy.*\$499/ });
  await expect(row).toBeVisible();
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
  await page.getByLabel("Note").fill("Fix this first.");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Request sent.")).toBeVisible();
});
