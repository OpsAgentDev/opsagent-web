import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("connect-your-agent docs and empty connected agents", async ({ page, request }) => {
  await page.goto("/docs/connect-your-agent");
  await expect(page.getByText("claude mcp add --transport http opsagent https://brain.opsagent.dev/mcp")).toBeVisible();
  for (const name of ["ChatGPT", "VS Code (GitHub Copilot)", "Gemini CLI", "OpenAI Codex CLI", "Other clients"]) {
    await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
  }
  await page.getByRole("navigation", { name: "Clients" }).getByRole("link", { name: "Other clients" }).click();
  await expect(page).toHaveURL(/#other$/);
  await signUp(page, request);
  await page.goto("/settings/agents");
  await expect(page.getByRole("link", { name: "Connect your agent" })).toBeVisible();
});
