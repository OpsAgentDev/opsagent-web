import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("remaining screens: friendly not-found, chat box off with AI off, no empty Urgent alerts, no repeated payment line", async ({ page, request }) => {
  await signUp(page, request);

  await page.goto("/connections/00000000-0000-0000-0000-000000000000");
  await expect(page.getByRole("alert")).toContainText("We couldn't find that");
  await expect(page.getByRole("link", { name: "Back to the dashboard" })).toBeVisible();

  await page.goto("/chat");
  await expect(page.getByLabel("Message")).toBeDisabled();

  await page.goto("/settings/delivery");
  await expect(page.getByRole("heading", { name: "Slack" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Urgent alerts" })).toHaveCount(0);

  await page.goto("/settings/human-review");
  await expect(page.getByRole("heading", { name: "Finding review" })).toBeVisible();
  await expect(page.getByText("Pay securely with Stripe.")).toHaveCount(2); // once per card
});
