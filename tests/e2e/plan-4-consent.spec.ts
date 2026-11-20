import { createHash, randomBytes } from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { linkInMail, signUp } from "./helpers";

const BRAIN = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const REDIRECT = "http://127.0.0.1:8976/callback";

/** Registers a dynamic client and returns its authorize URL (PKCE S256). */
async function authorizeUrl(request: APIRequestContext, scope: string): Promise<string> {
  const reg = await request.post(`${BRAIN}/oauth/register`, {
    data: { client_name: "E2E agent", redirect_uris: [REDIRECT], token_endpoint_auth_method: "none" },
  });
  const { client_id } = (await reg.json()) as { client_id: string };
  const challenge = createHash("sha256").update(randomBytes(32)).digest("base64url");
  const q = new URLSearchParams({
    response_type: "code", client_id, redirect_uri: REDIRECT, state: "xyz", code_challenge: challenge,
    code_challenge_method: "S256", resource: `${BRAIN}/mcp`, scope,
  });
  return `${BRAIN}/oauth/authorize?${q}`;
}

/** Starts authorize in the browser so brain sets the binding cookie; the consent page is its redirect. */
async function startConsent(page: Page, request: APIRequestContext, scope = "opsagent.read") {
  await page.route(`${REDIRECT.replace("/callback", "")}/**`, (r) => r.fulfill({ body: "client callback" }));
  await page.goto(await authorizeUrl(request, scope));
}

test("approve_redirects_to_client_with_code", async ({ page, request }) => {
  await signUp(page, request);
  await startConsent(page, request);
  await expect(page).toHaveURL(/\/oauth\/consent\?request_id=/);
  await expect(page.getByText("Unverified client")).toBeVisible();
  await expect(page.getByText("Only approve if you started this on your own computer.")).toBeVisible();
  await expect(page.getByTestId("redirect-uri")).toHaveText(REDIRECT);
  await page.getByRole("button", { name: "Approve" }).click();
  await page.waitForURL(/^http:\/\/127\.0\.0\.1:8976\/callback\?/);
  const url = new URL(page.url());
  expect(url.searchParams.get("code")).toBeTruthy();
  expect(url.searchParams.get("state")).toBe("xyz");
});

test("signed_out_returns_to_consent_after_sign_in", async ({ page, request, browser }) => {
  const email = await signUp(page, request); // creates the account, then we sign out by using a fresh context
  const ctx = await browser.newContext();
  const fresh = await ctx.newPage();
  await startConsent(fresh, request);
  await expect(fresh).toHaveURL(/\/sign-in\?return_to=/);
  await fresh.getByRole("link", { name: "Continue with email" }).click(); // return_to survives the hop
  await expect(fresh).toHaveURL(/\/sign-in\/email\?return_to=/);
  await fresh.getByLabel("Email").fill(email);
  await fresh.getByRole("button", { name: "Send link and code" }).click();
  await expect(fresh.getByText("Or open the link in the email.")).toBeVisible();
  await fresh.goto(await linkInMail(request, email, /https?:\/\/\S+\/auth\/callback\?token=\S+/));
  await fresh.getByRole("button", { name: "Sign in" }).click();
  await expect(fresh).toHaveURL(/\/oauth\/consent\?request_id=/);
  await expect(fresh.getByRole("button", { name: "Approve" })).toBeVisible();
  await ctx.close();
});

const CHANGES = "Let this agent make changes";
const CHANGES_NOTE =
  "It can accept, snooze and reopen findings, and connect cloud accounts. It cannot change the cloud accounts themselves, billing, members or delivery.";
const isDecision = (r: { method(): string; url(): string }) => r.method() === "POST" && r.url().includes("/v1/oauth/consent/");

/** Approves and returns the body the page sent; the granted scope is brain's to test. */
async function approve(page: Page, button: string): Promise<unknown> {
  const sent = page.waitForRequest(isDecision);
  await page.getByRole("button", { name: button, exact: true }).click();
  const body: unknown = (await sent).postDataJSON();
  await page.waitForURL(/^http:\/\/127\.0\.0\.1:8976\/callback\?/);
  return body;
}

test("a read request starts unticked; ticking it approves read and changes", async ({ page, request }) => {
  await signUp(page, request);
  await startConsent(page, request);
  await expect(page.getByText("E2E agent wants access to your OpsAgent findings and connections.")).toBeVisible();
  const box = page.getByRole("checkbox", { name: CHANGES });
  await expect(box).not.toBeChecked();
  await expect(box).toHaveAccessibleDescription(CHANGES_NOTE);
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toBeVisible();
  await box.check();
  expect(await approve(page, "Approve read and changes")).toMatchObject({ allow_changes: true });
});

test("a write request starts ticked; unticking it approves read only", async ({ page, request }) => {
  await signUp(page, request);
  await startConsent(page, request, "opsagent.read opsagent.write");
  await expect(page.getByText("E2E agent wants access to your OpsAgent findings and connections.")).toBeVisible();
  const box = page.getByRole("checkbox", { name: CHANGES });
  await expect(box).toBeChecked();
  await expect(page.getByRole("button", { name: "Approve read and changes", exact: true })).toBeVisible();
  await box.uncheck();
  expect(await approve(page, "Approve")).toMatchObject({ allow_changes: false });
});

test("a member is not offered changes, also when the client asked for them", async ({ page, request }) => {
  await signUp(page, request);
  // The view says the chosen organisation's role; a member's is set here, whatever brain sends.
  await page.route("**/v1/oauth/consent/*", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const response = await route.fetch();
    const view = (await response.json()) as { organisations: object[] };
    await route.fulfill({ response, json: { ...view, organisations: view.organisations.map((o) => ({ ...o, role: "member" })) } });
  });
  await startConsent(page, request, "opsagent.read opsagent.write");
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: CHANGES })).toHaveCount(0);
  expect(await approve(page, "Approve")).toMatchObject({ allow_changes: false });
});
