import { expect, test } from "@playwright/test";
import { connectNoisy, forgetPasskeySkip, signUp } from "./helpers";

test("findings are critical first with a summary; dashboard and connection page point the way", async ({ page, request }) => {
  await signUp(page, request);
  const id = await connectNoisy(page);

  // The connection page: a sentence for the state, readable facts, and a way to the findings.
  await expect(page.getByText("Connected. OpsAgent checks this account every night and urgent issues every 15 minutes.")).toBeVisible();
  await expect(page.getByText("Organisation default").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Scan now" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Preview briefing" })).toBeVisible();
  await page.getByRole("link", { name: "View findings" }).click();
  await expect(page).toHaveURL(/\/findings$/);

  // Findings: the first row is a critical one (the first scan is queued when the connection connects).
  const rows = page.locator("tbody tr");
  await expect(async () => {
    await page.reload();
    await expect(rows.first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 60_000 });
  await expect(rows.first().getByRole("cell").first()).toHaveText("critical");
  await expect(page.getByTestId("findings-summary")).toHaveText(/(\d+ open findings? · \d+ critical · \d+ high|Open findings, most severe first\.)/);
  await expect(page.getByRole("columnheader", { name: "Status" })).toHaveCount(0);
  await expect(rows.first().getByRole("button", { name: "Snooze" })).toHaveAttribute("title", /Hide/);
  await page.getByLabel("Status").selectOption("");
  await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();

  // Dashboard: a link to all findings and the top issues.
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /^View all \d+ findings$/ })).toBeVisible();
  await expect(page.getByText("out of 100", { exact: true })).toBeVisible();
  const issues = page.getByRole("list", { name: "Top open issues" }).getByRole("listitem");
  await expect(issues.first()).toBeVisible();
  expect(await issues.count()).toBeLessThanOrEqual(3);
  await issues.first().getByRole("link").click();
  await expect(page).toHaveURL(/\/findings\/[0-9a-f-]+$/);
  expect(id).toBeTruthy();
});

test("billing with no plan explains the trial before the button", async ({ page, request }) => {
  await signUp(page, request);
  await page.goto("/settings/billing");
  await expect(page.getByText("14-day free trial on the Team plan")).toBeVisible();
  await expect(page.getByText("Card required, and no charge until day 14.")).toBeVisible();
  await expect(page.getByText("The trial covers one cloud account.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start free trial" })).toBeVisible();
});

test("the passkey card shows on Settings > Security and not on other pages", async ({ page, request }) => {
  await signUp(page, request);
  await forgetPasskeySkip(page); // onboarding's "Skip for now" hides the card for 30 days
  const card = page.getByRole("heading", { name: "Add a passkey (recommended)" });
  await page.goto("/findings");
  await expect(page.getByRole("heading", { name: "Findings" })).toBeVisible();
  await expect(card).toHaveCount(0);
  await page.goto("/deliveries");
  await expect(page.getByRole("heading", { name: "Deliveries" })).toBeVisible();
  await expect(card).toHaveCount(0);
  await page.goto("/settings/security");
  await expect(card).toBeVisible();
});

test("deliveries explain an empty list", async ({ page, request }) => {
  await signUp(page, request);
  await page.goto("/deliveries");
  await expect(page.getByText("Nothing sent yet. Briefings and alerts appear here once a scan has run.")).toBeVisible();
});

test("an unknown page shows the branded 404 with a way back", async ({ page }) => {
  await page.goto("/no-such-page");
  await expect(page.getByRole("heading", { name: "This page doesn't exist" })).toBeVisible();
  await page.getByRole("link", { name: "Go to your dashboard" }).click();
  await expect(page).toHaveURL(/\/(dashboard|sign-in)$/);
});
