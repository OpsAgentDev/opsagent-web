import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("remaining screens: friendly not-found, chat box off with AI off, no empty Urgent alerts, no repeated payment line", async ({ page, request }) => {
  await signUp(page, request);

  await page.goto("/connections/00000000-0000-0000-0000-000000000000");
  await expect(page.locator("main").getByRole("alert")).toContainText("We couldn't find that");
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

test("a blocked connection explains itself in words and an owner can remove it", async ({ page, request }) => {
  await signUp(page, request);
  let status = "blocked";
  const id = "11111111-1111-4111-8111-111111111111";
  await page.route(`**/v1/orgs/*/connections/${id}`, (r) => {
    if (r.request().method() === "DELETE") {
      status = "disconnected";
      return r.fulfill({ json: { status, next_step: "Delete the CloudFormation stack OpsAgent-Read-x in your account to revoke access." } });
    }
    return r.fulfill({
      json: { id, display_name: "prod", provider: "aws", status, status_reason: status === "blocked" ? "account_already_connected" : "customer_disconnected" },
    });
  });

  await page.goto(`/connections/${id}`);
  await expect(page.getByText("already connected to another OpsAgent organisation")).toBeVisible();
  await expect(page.getByText("account_already_connected")).toHaveCount(0);

  await page.getByRole("button", { name: "Remove connection" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.getByText("Delete the CloudFormation stack OpsAgent-Read-x")).toBeVisible();
  await expect(page.getByText("This connection is turned off.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove connection" })).toHaveCount(0);
});
