import { createHash, randomBytes } from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { linkInMail, signUp } from "./helpers";

const BRAIN = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const REDIRECT = "http://127.0.0.1:8976/callback";

/** Registers a dynamic client and returns its authorize URL (PKCE S256). */
async function authorizeUrl(request: APIRequestContext): Promise<string> {
  const reg = await request.post(`${BRAIN}/oauth/register`, {
    data: { client_name: "E2E agent", redirect_uris: [REDIRECT], token_endpoint_auth_method: "none" },
  });
  const { client_id } = (await reg.json()) as { client_id: string };
  const challenge = createHash("sha256").update(randomBytes(32)).digest("base64url");
  const q = new URLSearchParams({
    response_type: "code", client_id, redirect_uri: REDIRECT, state: "xyz", code_challenge: challenge,
    code_challenge_method: "S256", resource: `${BRAIN}/mcp`, scope: "opsagent.read",
  });
  return `${BRAIN}/oauth/authorize?${q}`;
}

/** Starts authorize in the browser so brain sets the binding cookie; the consent page is its redirect. */
async function startConsent(page: Page, request: APIRequestContext) {
  await page.route(`${REDIRECT.replace("/callback", "")}/**`, (r) => r.fulfill({ body: "client callback" }));
  await page.goto(await authorizeUrl(request));
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
  await fresh.getByLabel("Email").fill(email);
  await fresh.getByRole("button", { name: "Send sign-in link" }).click();
  await expect(fresh.getByText("Check your email")).toBeVisible();
  await fresh.goto(await linkInMail(request, email, /https?:\/\/\S+\/auth\/callback\?token=\S+/));
  await fresh.getByRole("button", { name: "Sign in" }).click();
  await expect(fresh).toHaveURL(/\/oauth\/consent\?request_id=/);
  await expect(fresh.getByRole("button", { name: "Approve" })).toBeVisible();
  await ctx.close();
});
