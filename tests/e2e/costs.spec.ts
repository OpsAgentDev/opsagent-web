import { expect, test } from "@playwright/test";
import { connectNoisy, signUp, sql } from "./helpers";

test("the Spend page shows the stored 60 days, the flagged day, and an empty state without data", async ({ page, request }) => {
  await signUp(page, request);
  const id = await connectNoisy(page);

  // Brain queues the first full scan when the connection becomes connected; it stores the fixture's 60 days.
  await expect(async () => {
    expect(Number(sql(`SELECT count(DISTINCT day) FROM cost_daily WHERE connection_id = '${id}'`).trim())).toBe(60);
  }).toPass({ timeout: 60_000 });
  sql(
    `INSERT INTO findings (id, organisation_id, connection_id, check_id, resource_identity, variant, severity, status, title)
     SELECT gen_random_uuid(), organisation_id, id, '01', 'cost:2026-09-20', 'cost_anomaly', 'low', 'open', 'spike' FROM connections WHERE id = '${id}'`,
  );

  await page.goto(`/connections/${id}`);
  await page.getByRole("link", { name: "Spend", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Spend", exact: true })).toBeVisible();
  // en-GB writes September as "Sep" or "Sept" depending on the browser's ICU data.
  await expect(page.getByTestId("spend-note")).toHaveText(
    /^Unblended cost per Cost Explorer, through 30 Sept? 2026\. The newest days can still change\.$/,
  );
  await expect(page.getByTestId("spend-summary")).toContainText(/Newest 30 days: \$[\d,]+\.\d\d\. Previous 30 days: \$[\d,]+\.\d\d\./);
  await expect(page.getByTestId("spend-short")).toHaveCount(0);
  await expect(page.getByRole("figure")).toBeVisible();
  expect(await page.getByTestId("spend-services").locator("tbody tr").count()).toBeGreaterThan(0);
  await expect(page.getByTestId("spend-movers")).toBeVisible();

  const flagged = page.getByTestId("spend-flagged");
  await expect(flagged).toContainText(/20 Sept? 2026/);
  await flagged.getByRole("link", { name: "Spike finding" }).first().click();
  await expect(page).toHaveURL(/\/findings\/[0-9a-f-]+$/);

  sql(`DELETE FROM cost_daily WHERE connection_id = '${id}'`);
  await page.goto(`/connections/${id}/costs`);
  await expect(page.getByTestId("spend-empty")).toHaveText(
    "No spend data yet. It appears after a nightly scan once AWS Cost Explorer has data for the account.",
  );
});
