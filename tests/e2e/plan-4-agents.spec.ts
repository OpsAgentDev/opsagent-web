import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("connect-your-agent docs and empty connected agents", async ({ page, request }) => {
  await page.goto("/docs/connect-your-agent");
  await expect(page.getByText("claude mcp add --transport http opsagent https://brain.opsagent.dev/mcp")).toBeVisible();
  await signUp(page, request);
  await page.goto("/settings/agents");
  await expect(page.getByRole("link", { name: "Connect your agent" })).toBeVisible();
});
