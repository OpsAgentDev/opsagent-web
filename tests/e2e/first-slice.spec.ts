import { expect, test } from "@playwright/test";
import { connectNoisy, signUp } from "./helpers";

test("sign in, connect the fake noisy account, scan, snooze a critical finding", async ({ page, request }) => {
  await signUp(page, request);
  const connectionUrl = `/connections/${await connectNoisy(page)}`;

  // Brain queues the first full scan when the connection becomes connected.
  await page.goto("/findings");
  const critical = page.locator("tbody tr", { has: page.getByRole("cell", { name: "critical", exact: true }) });
  await expect(async () => {
    await page.reload();
    await expect(critical.first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 60_000 });

  // The automatic scan counts toward the hourly limit, so a manual one is rejected and the 429 renders.
  await page.goto(connectionUrl);
  await page.getByRole("button", { name: "Scan now" }).click();
  await expect(page.getByText("A scan ran for this connection within the last hour. (rate_limited)")).toBeVisible();

  await page.goto("/findings");
  const row = critical.first();
  const id = await row.getAttribute("data-id");
  await row.getByRole("button", { name: "Snooze" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Snooze" }).click();
  await expect(page.locator(`tbody tr[data-id="${id}"]`)).toHaveCount(0);

  await page.goto("/dashboard");
  await expect(page.getByText("Posture score")).toBeVisible();
});
