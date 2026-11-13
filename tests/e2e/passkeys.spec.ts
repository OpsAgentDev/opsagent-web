import { expect, test, type Page } from "@playwright/test";
import { codeInMail, forgetPasskeySkip, signUp } from "./helpers";

const CARD = "Add a passkey (recommended)";

// The real discoverable path: brain requires user verification and a resident key.
async function authenticator(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true },
  });
}

test("a user with an organisation sees the recommendation on Settings > Security and can dismiss it", async ({ page, request }) => {
  await signUp(page, request); // the dashboard checklist carries no card
  await forgetPasskeySkip(page); // onboarding's "Skip for now" hides the card for 30 days
  await page.goto("/settings/security");
  await expect(page.getByRole("heading", { name: CARD })).toBeVisible();
  await expect(page.getByText("Sign in next time with your fingerprint, face or device PIN. No email to wait for.")).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.getByRole("heading", { name: CARD })).toBeHidden();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Security" })).toBeVisible();
  await expect(page.getByRole("heading", { name: CARD })).toBeHidden();
});

test("add passkey from the prompt, then sign in with it", async ({ page, request }) => {
  await authenticator(page);
  await signUp(page, request); // Settings pages sit behind an organisation
  // On the dashboard the checklist's passkey row carries the nudge; it goes once the layout knows about the passkey.
  const add = page.getByRole("button", { name: "Add a passkey", exact: true });
  await add.click();
  await expect(add).toBeHidden();
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
  await forgetPasskeySkip(page);
  await page.reload(); // the card shows on Settings > Security once the layout knows the passkey is gone
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
  await page.getByRole("link", { name: "Continue with email" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send link and code" }).click();
  await page.getByLabel("Code").fill(await codeInMail(request, email));
  await expect(page).toHaveURL(/\/dashboard$/);
});
