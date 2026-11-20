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

test("a pending connection offers only Finish connecting, then the actions once connected", async ({ page, request }) => {
  await signUp(page, request);
  sql("UPDATE connections SET status = 'disconnected' WHERE provider = 'fake' AND status IN ('connected','degraded','revoked')");
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Connect an AWS account" }).click();
  await page.getByLabel("Fake (local fixtures)").check();
  await page.getByLabel("Display name").fill("noisy");
  const created = page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname.endsWith("/connections"));
  await page.getByRole("button", { name: "Create connection" }).click();
  const { id } = (await (await created).json()) as { id: string };

  // Left before verifying: the connection page is where it is picked up again.
  await page.goto(page.url().replace("/onboarding/connect-aws", `/connections/${id}`));
  await expect(page.getByTestId("connection-status")).toHaveText("pending");
  await expect(page.getByRole("heading", { name: "Finish connecting" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Scan now" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Preview briefing" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "View findings" })).toHaveCount(0);

  await page.getByRole("button", { name: "Verify connection" }).click();
  await expect(page.getByTestId("connection-status")).toHaveText("connected");
  await expect(page.getByRole("button", { name: "Scan now" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Finish connecting" })).toHaveCount(0);
});

test("a pending connection that AWS refused shows the launch link again and what to check", async ({ page, request }) => {
  await signUp(page, request);
  sql("UPDATE connections SET status = 'disconnected' WHERE provider = 'fake' AND status IN ('connected','degraded','revoked')");
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Connect an AWS account" }).click();
  await page.getByLabel("Fake (local fixtures)").check();
  await page.getByLabel("Display name").fill("refused");
  const created = page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname.endsWith("/connections"));
  await page.getByRole("button", { name: "Create connection" }).click();
  const { id } = (await (await created).json()) as { id: string };
  sql(`UPDATE connections SET status_reason = 'access_denied' WHERE id = '${id}'`);

  // The fake provider has no launch link, so brain's answer for a pending connection is stubbed.
  const launch = "https://console.aws.amazon.com/cloudformation/home#/stacks/quickcreate?stackName=opsagent-e2e";
  await page.route("**/v1/orgs/*/connections/*/reconnect", (r) => r.fulfill({ json: { quick_create_url: launch, stack_name: "opsagent-e2e" } }));
  await page.goto(page.url().replace("/onboarding/connect-aws", `/connections/${id}`));

  await expect(page.getByRole("heading", { name: "Finish connecting" })).toBeVisible();
  await expect(page.getByText(/AWS refused access to this role\. Check that the stack finished/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Create the read-only role" })).toHaveAttribute("href", launch);
  await expect(page.getByText("opsagent-e2e")).toBeVisible();
  await expect(page.getByRole("button", { name: "Verify connection" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Scan now" })).toHaveCount(0);
});
