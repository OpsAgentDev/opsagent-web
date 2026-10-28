import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { codeInMail, signUp } from "./helpers";

const CARD = "Add a passkey (recommended)";

// The real discoverable path: brain requires user verification and a resident key.
async function authenticator(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true },
  });
}

async function signIn(page: Page, request: APIRequestContext, prefix: string) {
  const email = `e2e-${prefix}-${Date.now()}@example.com`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send link and code" }).click();
  await page.getByLabel("Code").fill(await codeInMail(request, email));
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("new user sees the recommendation and can dismiss it", async ({ page, request }) => {
  await signIn(page, request, "prompt");
  await expect(page.getByRole("heading", { name: CARD })).toBeVisible();
  await expect(page.getByText("Sign in next time with your fingerprint, face or device PIN. No email to wait for.")).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.getByRole("heading", { name: CARD })).toBeHidden();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Create your organisation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: CARD })).toBeHidden();
});

test("add passkey from the prompt, then sign in with it", async ({ page, request }) => {
  await authenticator(page);
  await signUp(page, request); // Settings pages sit behind an organisation
  await page.getByRole("button", { name: "Add a passkey", exact: true }).click();
  await expect(page.getByRole("heading", { name: CARD })).toBeHidden();

  await page.goto("/settings/security");
  await expect(page.getByRole("heading", { name: "Security" })).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(2); // header plus one passkey

  await page.context().clearCookies();
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Sign in with a passkey" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: CARD })).toBeHidden();
});

test("remove passkey", async ({ page, request }) => {
  await authenticator(page);
  await signUp(page, request);
  await page.goto("/settings/security");
  const main = page.getByRole("main");
  await expect(main.getByText("No passkeys yet.")).toBeVisible();
  await main.getByRole("button", { name: "Add a passkey" }).click();
  await expect(main.getByRole("row")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: CARD })).toBeHidden(); // the layout knows about the new passkey

  await main.getByRole("button", { name: /^Remove/ }).click();
  await expect(main.getByText("No passkeys yet.")).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: CARD })).toBeVisible();
});

test("a cancelled passkey sign-in says so and email still works", async ({ page, request }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  // No credential on this authenticator and user verification refused: the browser rejects with NotAllowedError.
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: false },
  });
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Sign in with a passkey" }).click();
  await expect(page.getByText("Passkey sign-in was cancelled.")).toBeVisible();

  const email = `e2e-cancel-${Date.now()}@example.com`;
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send link and code" }).click();
  await page.getByLabel("Code").fill(await codeInMail(request, email));
  await expect(page).toHaveURL(/\/dashboard$/);
});
