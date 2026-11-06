import { expect, test } from "@playwright/test";
import { codeInMail, sql } from "./helpers";

const RETURN_TO = "/oauth/consent?request_id=11111111-1111-1111-1111-111111111111";
const KEEP = `?return_to=${encodeURIComponent(RETURN_TO)}`;

test("options pages link to their email page and keep return_to", async ({ page }) => {
  for (const mode of ["sign-up", "sign-in"]) {
    await page.goto(`/${mode}`);
    await expect(page.getByRole("link", { name: "Continue with email" })).toHaveAttribute("href", `/${mode}/email`);
    await expect(page.getByLabel("Email")).toHaveCount(0);
    await page.goto(`/${mode}${KEEP}`);
    await expect(page.getByRole("link", { name: "Continue with email" })).toHaveAttribute("href", `/${mode}/email${KEEP}`);
  }
});

test("sign-up asks for name and email, sign-in only for email", async ({ page }) => {
  await page.goto(`/sign-up/email${KEEP}`);
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(main.getByLabel("Name")).toBeVisible();
  await expect(main.getByLabel("Email")).toBeVisible();
  await expect(main.getByRole("link", { name: "Back to all options" })).toHaveAttribute("href", `/sign-up${KEEP}`);

  await page.goto(`/sign-in/email${KEEP}`);
  await expect(main.getByRole("heading", { name: "Sign in with email" })).toBeVisible();
  await expect(main.getByLabel("Email")).toBeVisible();
  await expect(main.getByLabel("Name")).toHaveCount(0);
  await expect(main.getByRole("link", { name: "Back to all options" })).toHaveAttribute("href", `/sign-in${KEEP}`);
});

test("sign-up with a name creates the account and stores the name", async ({ page, request }) => {
  const email = `e2e-name-${Date.now()}@example.com`;
  await page.goto("/sign-up/email");
  await page.getByLabel("Name").fill("  Ada Lovelace ");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send link and code" }).click();
  await page.getByLabel("Code").fill(await codeInMail(request, email));
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(sql(`SELECT name FROM users WHERE email = '${email}'`).trim()).toBe("Ada Lovelace");
});

test("the code step reads as a code field and a wrong code refocuses it", async ({ page, request }) => {
  const email = `e2e-long-address-for-wrapping-${Date.now()}@subdomain.example.com`;
  await page.goto("/sign-in/email");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send link and code" }).click();

  const code = page.getByLabel("Code");
  await expect(code).toHaveAttribute("placeholder", "123456");
  await expect(code).toHaveAttribute("maxlength", "6");
  await expect(code).toHaveAttribute("inputmode", "numeric");
  await expect(code).toHaveAttribute("autocomplete", "one-time-code");
  await expect(code).toBeFocused();
  // No empty status strip, and the address is bold and may break anywhere.
  await expect(page.getByRole("status")).toHaveCount(0);
  const addr = page.getByRole("main").locator("strong", { hasText: email });
  await expect(addr).toHaveCSS("overflow-wrap", "anywhere");
  expect(Number(await addr.evaluate((el) => getComputedStyle(el).fontWeight))).toBeGreaterThanOrEqual(600);

  const real = await codeInMail(request, email);
  await code.fill(real === "000000" ? "111111" : "000000");
  await expect(page.getByText("That code didn't work.")).toBeVisible();
  await expect(code).toHaveValue("");
  await expect(code).toBeFocused();
  await expect(page.getByRole("link", { name: "Back to all options" })).toHaveAttribute("href", "/sign-in");

  await code.fill(real);
  await expect(page).toHaveURL(/\/dashboard$/);
});
