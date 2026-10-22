import { expect, test, type APIRequestContext } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

/** Polls mailpit until a message to `email` arrives and returns the sign-in link in it. */
async function magicLinkFor(request: APIRequestContext, email: string): Promise<string> {
  let link = "";
  await expect(async () => {
    const search = await request.get(`${MAILPIT}/api/v1/search`, { params: { query: `to:"${email}"` } });
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    expect(messages.length).toBeGreaterThan(0);
    const msg = await request.get(`${MAILPIT}/api/v1/message/${messages[0]!.ID}`);
    const { Text } = (await msg.json()) as { Text: string };
    link = Text.match(/https?:\/\/\S+\/auth\/callback\?token=\S+/)?.[0] ?? "";
    expect(link).not.toBe("");
  }).toPass({ timeout: 20_000 });
  return link;
}

test("sign in, connect the fake noisy account, scan, snooze a critical finding", async ({ page, request }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send sign-in link" }).click();
  await expect(page.getByText("Check your email")).toBeVisible();

  await page.goto(await magicLinkFor(request, email));
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByLabel("Organisation name").fill(`E2E ${Date.now()}`);
  await page.getByRole("button", { name: "Create organisation" }).click();

  await page.getByRole("link", { name: "Connect an AWS account" }).click();
  await expect(page).toHaveURL(/\/onboarding\/connect-aws$/);
  await page.getByLabel("Fake (local fixtures)").check();
  await page.getByLabel("Display name").fill("noisy");
  await page.getByRole("button", { name: "Create connection" }).click();
  await page.getByRole("button", { name: "Verify connection" }).click();

  await expect(page).toHaveURL(/\/connections\/[0-9a-f-]+$/);
  await expect(page.getByTestId("connection-status")).toHaveText("connected");
  await page.getByRole("button", { name: "Scan now" }).click();
  await expect(page.getByText("Scan started")).toBeVisible();

  await page.goto("/findings");
  const critical = page.locator("tbody tr", { has: page.getByRole("cell", { name: "critical", exact: true }) });
  await expect(async () => {
    await page.reload();
    await expect(critical.first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 60_000 });

  const row = critical.first();
  const id = await row.getAttribute("data-id");
  await row.getByRole("button", { name: "Snooze" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Snooze" }).click();
  await expect(page.locator(`tbody tr[data-id="${id}"]`)).toHaveCount(0);

  await page.goto("/dashboard");
  await expect(page.getByText("Posture score")).toBeVisible();
});
