import { expect, test } from "@playwright/test";
import { codeInMail } from "./helpers";

test("sign-up page shows three options", async ({ page }) => {
  await page.goto("/sign-up");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Create your OpsAgent account" })).toBeVisible();
  for (const name of ["Continue with Google", "Continue with GitHub", "Send link and code"]) {
    await expect(main.getByRole("button", { name })).toBeVisible();
  }
  await expect(main.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
  await expect(main.getByText("After you sign in we'll suggest adding a passkey, so next time is one tap.")).toBeVisible();
});

test("sign-in signs in with the emailed code", async ({ page, request }) => {
  const email = `e2e-code-${Date.now()}@example.com`;
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Sign in to OpsAgent" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send link and code" }).click();
  await expect(page.getByText("Or open the link in the email.")).toBeVisible();

  const code = await codeInMail(request, email);
  await page.getByLabel("Code").fill(`${code.slice(0, 3)} ${code.slice(3)}`);
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("a wrong code shows the error, a new code signs in", async ({ page, request }) => {
  const email = `e2e-wrong-${Date.now()}@example.com`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send link and code" }).click();
  const first = await codeInMail(request, email);
  await page.getByLabel("Code").fill(first === "000000" ? "111111" : "000000");
  await expect(page.getByText("That code didn't work. Check the latest email or send a new one.")).toBeVisible();

  await page.getByRole("button", { name: "Send a new code" }).click();
  await expect(page.getByText("We sent a new link and code.")).toBeVisible();
  await expect(page.getByLabel("Code")).toHaveValue("");
  await page.getByLabel("Code").fill(await codeInMail(request, email, 2));
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("use a different email returns to the form", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(`e2e-other-${Date.now()}@example.com`);
  await page.getByRole("button", { name: "Send link and code" }).click();
  await page.getByRole("button", { name: "Use a different email" }).click();
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("sign-in shows provider error from query", async ({ page }) => {
  await page.goto("/sign-in?error=oauth_state");
  await expect(page.getByText("Sign-in took too long or was opened in another tab. Try again.")).toBeVisible();
});

test("unconfigured provider says so", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page.getByText("Google sign-in isn't available yet.")).toBeVisible();
});

test("privacy and terms pages render and are in the footer", async ({ page }) => {
  for (const [path, heading] of [["/privacy", "Privacy policy"], ["/terms", "Terms of service"]] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByText("Last updated 28 October 2026")).toBeVisible();
    await expect(page.getByRole("contentinfo").getByRole("link", { name: heading.split(" ")[0] })).toHaveAttribute("href", path);
  }
});

test("a signed-in visitor on sign-in and sign-up goes to the dashboard", async ({ page, request }) => {
  const email = `e2e-again-${Date.now()}@example.com`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send link and code" }).click();
  await page.getByLabel("Code").fill(await codeInMail(request, email));
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/sign-up");
  await expect(page).toHaveURL(/\/dashboard$/);
});
