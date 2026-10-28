import { execFileSync } from "node:child_process";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";
const BRAIN_DIR = process.env.BRAIN_DIR ?? "../opsagent-brain";

/** Polls mailpit until a message to `email` contains a link matching `pattern`; returns the link. */
export async function linkInMail(request: APIRequestContext, email: string, pattern: RegExp): Promise<string> {
  let link = "";
  await expect(async () => {
    const search = await request.get(`${MAILPIT}/api/v1/search`, { params: { query: `to:"${email}"` } });
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    for (const m of messages) {
      const msg = await request.get(`${MAILPIT}/api/v1/message/${m.ID}`);
      const { Text } = (await msg.json()) as { Text: string };
      link = Text.match(pattern)?.[0] ?? "";
      if (link) break;
    }
    expect(link).not.toBe("");
  }).toPass({ timeout: 30_000 });
  return link;
}

/** Polls mailpit until `count` mails reached `email`; returns the newest one's code (subject first, then the body). */
export async function codeInMail(request: APIRequestContext, email: string, count = 1): Promise<string> {
  let code = "";
  await expect(async () => {
    const search = await request.get(`${MAILPIT}/api/v1/search`, { params: { query: `to:"${email}"` } });
    const { messages } = (await search.json()) as { messages: { ID: string; Subject: string }[] };
    const m = messages[0]; // newest first
    if (!m || messages.length < count) throw new Error(`fewer than ${count} mails to ${email} yet`);
    code = m.Subject.match(/code: (\d{6})/)?.[1] ?? "";
    if (!code) {
      const { Text } = (await (await request.get(`${MAILPIT}/api/v1/message/${m.ID}`)).json()) as { Text: string };
      code = Text.match(/enter this code: (\d{6})/)?.[1] ?? "";
    }
    expect(code).not.toBe("");
  }).toPass({ timeout: 30_000 });
  return code;
}

/** Runs SQL against the e2e database (scripts/e2e.sh creates it fresh per run). */
export function sql(query: string): string {
  return execFileSync(
    "docker",
    ["compose", "-f", `${BRAIN_DIR}/docker-compose.yml`, "exec", "-T", "postgres",
      "psql", "-qtAU", "loco", "-d", "opsagent_brain_e2e", "-c", query],
    { encoding: "utf8" },
  );
}

/** Runs a brain CLI task (`cargo run -- task …`) with the env scripts/e2e.sh exported for brain. */
export function brainTask(...args: string[]): void {
  execFileSync("cargo", ["run", "-q", "--", "task", ...args], { cwd: `${BRAIN_DIR}/app`, stdio: "inherit" });
}

/** Signs a new user in with the emailed code and creates an organisation; returns the email. */
export async function signUp(page: Page, request: APIRequestContext): Promise<string> {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send link and code" }).click();
  await page.getByLabel("Code").fill(await codeInMail(request, email));
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByLabel("Organisation name").fill(`E2E ${Date.now()}`);
  await page.getByRole("button", { name: "Create organisation" }).click();
  // Wait for the organisation to exist before the caller navigates away.
  await expect(page.getByRole("heading", { name: "Create your organisation" })).toBeHidden();
  return email;
}

/**
 * Connects the fake `noisy` account and waits for `connected`; returns the connection id.
 * The fake account can back one live connection only, so an earlier spec's claim is released first
 * (specs run one at a time, playwright.config.ts).
 */
export async function connectNoisy(page: Page): Promise<string> {
  sql("UPDATE connections SET status = 'disconnected' WHERE provider = 'fake' AND status IN ('connected','degraded','revoked')");
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Connect an AWS account" }).click();
  await expect(page).toHaveURL(/\/onboarding\/connect-aws$/);
  await page.getByLabel("Fake (local fixtures)").check();
  await page.getByLabel("Display name").fill("noisy");
  await page.getByRole("button", { name: "Create connection" }).click();
  await page.getByRole("button", { name: "Verify connection" }).click();

  await expect(page).toHaveURL(/\/connections\/[0-9a-f-]+$/);
  await expect(page.getByTestId("connection-status")).toHaveText("connected");
  return page.url().split("/").pop()!;
}
