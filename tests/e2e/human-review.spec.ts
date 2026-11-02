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
