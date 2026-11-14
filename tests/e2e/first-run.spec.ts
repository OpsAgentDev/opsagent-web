import { expect, test } from "@playwright/test";
import { connectNoisy, createOrg, signIn } from "./helpers";

test("new user goes Terms (with the recommended passkey), Organisation, then a dashboard with a setup checklist that follows their progress", async ({ page, request }) => {
  const email = await signIn(page, request, { onboard: false });
  const steps = page.getByRole("list", { name: "Steps" });
  const current = steps.locator('[aria-current="step"]');

  // Step 1, terms: no sidebar, Continue is disabled until the box is ticked; sign out and delete stay reachable.
  await expect(page.getByText("Step 1 of 2")).toBeVisible();
  await expect(current).toHaveText(/Terms/);
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete my account" })).toBeVisible();
  const terms = page.getByRole("link", { name: "Terms", exact: true });
  await expect(terms).toHaveAttribute("href", "/terms");
  await expect(terms).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
  const go = page.getByRole("button", { name: "Continue", exact: true });
  // The passkey sits on top of the same card, ticked by default; the terms box below it is what Continue waits for.
  const passkey = page.getByRole("checkbox", { name: /Add a passkey/ });
  await expect(page.getByText("Add a passkey (recommended)")).toBeVisible();
  await expect(passkey).toBeChecked();
  expect((await passkey.boundingBox())!.y).toBeLessThan((await page.getByLabel("I agree to the Terms and the Privacy Policy").boundingBox())!.y);
  await expect(page.getByRole("group", { name: "Theme" })).toHaveCount(0);
  await expect(go).toBeDisabled();
  await page.reload(); // nothing is accepted by looking
  await expect(go).toBeDisabled();
  await page.getByLabel("I agree to the Terms and the Privacy Policy").check();
  await passkey.uncheck();
  await go.click();

  // Step 2, organisation.
  await expect(page.getByText("Step 2 of 2")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create your organisation" })).toBeVisible();
  await expect(page.getByLabel("Organisation name")).toBeFocused();
  await expect(page.getByRole("link", { name: "Findings" })).toHaveCount(0);

  // The dashboard, in the shell: sidebar, overview tiles reading "–" before a scan, and the checklist with Connect AWS current.
  await createOrg(page);
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  const tile = (label: string) => page.locator(".tile").filter({ hasText: label }).locator("strong");
  await expect(tile("Posture score")).toHaveText("–");
  await expect(tile("Open findings")).toHaveText("–");
  await expect(tile("Critical and high")).toHaveText("–");
  await expect(tile("Accounts connected")).toHaveText("0");
  const checklist = page.getByRole("list", { name: "Setup" });
  const row = checklist.getByRole("listitem").filter({ hasText: "Connect a cloud account" });
  await expect(row).toHaveAttribute("aria-current", "step");
  await expect(row.getByRole("link", { name: "Connect an AWS account" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add a passkey (recommended)" })).toHaveCount(0); // the checklist carries the nudge

  // Skipping hides the checklist and leaves a way back.
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(checklist).toHaveCount(0);
  await page.getByRole("button", { name: "Show setup steps" }).click();
  await expect(checklist).toBeVisible();

  // After connecting, the row is done and the tiles fill in once the first scan finishes.
  await connectNoisy(page);
  await page.goto("/dashboard");
  await expect(checklist.getByRole("listitem").filter({ hasText: "Connect a cloud account" })).toHaveAttribute("data-state", "done");
  await expect(tile("Accounts connected")).toHaveText("1");
  await expect(async () => {
    await page.reload();
    await expect(tile("Posture score")).toHaveText(/^\d+$/, { timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
  await expect(tile("Open findings")).toHaveText(/^\d+$/);
  await expect(tile("Critical and high")).toHaveText(/^\d+$/);

  // Terms are asked once: the next visit opens the app.
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByLabel("I agree to the Terms and the Privacy Policy")).toHaveCount(0);
});
