import { expect, test } from "@playwright/test";

// Needs the widget built in: E2E_TURNSTILE_SITE_KEY=test-site-key bash scripts/e2e.sh auth-turnstile.spec.ts
// (a default run has no site key, so no widget renders and this is skipped).
test.skip(!process.env.E2E_TURNSTILE_SITE_KEY, "web was built without NEXT_PUBLIC_TURNSTILE_SITE_KEY");

test("submit waits for the Turnstile token, which reaches the request body", async ({ page }) => {
  await page.addInitScript(() => {
    // Stub of Cloudflare's explicit-render API; the test hands out the token by hand.
    (window as unknown as Record<string, unknown>).turnstile = {
      render: (_el: unknown, opts: { callback: (t: string) => void }) => {
        (window as unknown as Record<string, unknown>).__give = () => opts.callback("stub-token");
        return "w1";
      },
      reset: () => {}, remove: () => {},
    };
  });
  let body: Record<string, unknown> | undefined;
  await page.route("**/v1/auth/magic-link", async (route) => {
    body = route.request().postDataJSON();
    await route.continue();
  });
  await page.goto("/sign-in/email");
  await page.getByLabel("Email").fill(`e2e-turnstile-${Date.now()}@example.com`);
  const submit = page.getByRole("button", { name: "Send link and code" });
  await expect(submit).toBeDisabled();
  await page.evaluate(() => (window as unknown as { __give: () => void }).__give());
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByLabel("Code")).toBeVisible();
  expect(body?.turnstile_token).toBe("stub-token");
});
