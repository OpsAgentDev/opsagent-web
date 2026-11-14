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
