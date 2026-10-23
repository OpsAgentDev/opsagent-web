import { expect, test } from "@playwright/test";
import { brainTask, connectNoisy, linkInMail, signUp, sql } from "./helpers";

test("delivery settings, briefing preview, deliveries, recipient confirm and unsubscribe", async ({ page, request }) => {
  await signUp(page, request);
  const connection = await connectNoisy(page);
  const recipient = `e2e-recipient-${Date.now()}@example.com`;

  // Slack: the button asks brain for the authorize URL and goes there (no OAuth in e2e).
  await page.route("https://slack.com/**", (r) => r.fulfill({ body: "slack stub" }));
  await page.goto("/settings/delivery");
  await page.getByRole("button", { name: "Connect Slack" }).click();
  await expect(page).toHaveURL(/^https:\/\/slack\.com\/oauth\/v2\/authorize\?client_id=e2e-slack-client/);

  // An opt-in recipient stays pending until the confirm link is used.
  await page.goto("/settings/delivery");
  await page.getByLabel("Recipient email").fill(recipient);
  await page.getByRole("button", { name: "Add recipient" }).click();
  const row = page.locator("tbody tr", { hasText: recipient });
  await expect(row).toContainText("pending");

  await page.goto(await linkInMail(request, recipient, /https?:\/\/\S+\/recipients\/confirm\?token=\S+/));
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("You are subscribed.")).toBeVisible();
  await page.goto("/settings/delivery");
  await expect(row).toContainText("active");

  // The preview is what deliver_briefing would send once the first scan has finished.
  await page.goto(`/connections/${connection}/briefing`);
  await expect(async () => {
    await page.reload();
    await expect(page.getByTestId("briefing-text")).toContainText(/[1-9]\d* critical/, { timeout: 2_000 });
  }).toPass({ timeout: 60_000 });

  // No Slack in e2e, so the briefing goes to the owner by email.
  brainTask("deliver:briefing", `connection:${connection}`);
  await page.goto("/deliveries");
  await page.getByLabel("Kind").selectOption("briefing");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText("fallback_email");

  // The weekly mail carries the unsubscribe footer; make it due now and tick the scheduler.
  sql(`UPDATE schedules SET next_due_at = now() WHERE job_type = 'deliver_weekly' AND connection_id = '${connection}'`);
  brainTask("scheduler:tick");
  await page.goto(await linkInMail(request, recipient, /https?:\/\/\S+\/unsubscribe\/\S+/));
  await page.getByRole("button", { name: "Unsubscribe" }).click();
  await expect(page.getByText("You are unsubscribed.")).toBeVisible();

  await page.goto("/settings/delivery");
  await expect(page.getByRole("heading", { name: "Recipients" })).toBeVisible();
  await expect(row).toHaveCount(0);
});
