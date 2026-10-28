import { expect, test } from "@playwright/test";
import { connectNoisy, signUp } from "./helpers";

test("delivery settings shows urgent alerts switch on by default and persists off", async ({ page, request }) => {
  await signUp(page, request);
  await connectNoisy(page);
  await page.goto("/settings/delivery");
  const sw = page.getByRole("checkbox", { name: /Urgent alerts: tell me right away about new critical problems/ });
  await expect(sw).toBeChecked();
  await sw.click();
  await expect(sw).not.toBeChecked();
  await page.reload();
  await expect(sw).not.toBeChecked();
});
