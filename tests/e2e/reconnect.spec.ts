import { expect, test } from "@playwright/test";
import { connectNoisy, signUp, sql } from "./helpers";

test("a revoked connection is reconnected in place and keeps its id", async ({ page, request }) => {
  await signUp(page, request);
  const id = await connectNoisy(page);
  await expect(page.getByRole("button", { name: "Reconnect" })).toHaveCount(0);

  sql(`UPDATE connections SET status = 'revoked', status_reason = 'access_denied' WHERE id = '${id}'`);
  await page.reload();
  await expect(page.getByTestId("connection-status")).toHaveText("revoked");

  await page.getByRole("button", { name: "Reconnect" }).click();
  await page.getByRole("button", { name: "Verify connection" }).click();

  await expect(page.getByTestId("connection-status")).toHaveText("connected");
  expect(page.url()).toContain(id);
  await expect(page.getByRole("heading", { name: "Reconnect" })).toHaveCount(0);
});

test("a connection turned off at the period end for a broken role says why and offers Reconnect", async ({ page, request }) => {
  await signUp(page, request);
  const id = await connectNoisy(page);
  sql(`UPDATE connections SET status = 'disconnected', status_reason = 'revoked_at_period_end' WHERE id = '${id}'`);
  await page.reload();
  await expect(page.getByText(/Its role stopped working, so it was turned off before the next billing period/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Reconnect" })).toBeVisible();
});
