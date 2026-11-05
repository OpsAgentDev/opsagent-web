import { expect, test } from "@playwright/test";
import { connectNoisy, createOrg, signIn } from "./helpers";

test("new user sees the welcome, then a setup checklist that follows their progress", async ({ page, request }) => {
  await signIn(page, request);

  // Welcome: no app bar links, no passkey card, the form and the road ahead.
  await expect(page.getByRole("heading", { name: "Create your organisation" })).toBeVisible();
  await expect(page.getByLabel("Organisation name")).toBeFocused();
  await expect(page.getByRole("link", { name: "Findings" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Add a passkey (recommended)" })).toHaveCount(0);
  await expect(page.getByRole("list", { name: "What happens next" }).getByText("Connect AWS")).toBeVisible();

  // Checklist: Connect AWS is the current step.
  await createOrg(page);
  const checklist = page.getByRole("list", { name: "Setup" });
  const row = checklist.getByRole("listitem").filter({ hasText: "Connect AWS" });
  await expect(row).toHaveAttribute("aria-current", "step");
  await expect(row.getByRole("link", { name: "Connect an AWS account" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add a passkey (recommended)" })).toHaveCount(0); // the checklist carries the nudge

  // After connecting, the row is done.
  await connectNoisy(page);
  await page.goto("/dashboard");
  await expect(checklist.getByRole("listitem").filter({ hasText: "Connect AWS" })).toHaveAttribute("data-state", "done");
});
