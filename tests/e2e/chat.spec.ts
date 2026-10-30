import { expect, test } from "@playwright/test";
import { connectNoisy, signUp, sql } from "./helpers";

const NEWEST_ORG = "(SELECT id FROM organisations ORDER BY created_at DESC LIMIT 1)";
const UUID = "[0-9a-f-]{36}";

test("streamed answer with a finding citation link", async ({ page, request }) => {
  await signUp(page, request);
  await connectNoisy(page);
  sql(`UPDATE organisations SET ai_enabled = true WHERE id = ${NEWEST_ORG}`);
  await page.goto("/findings");
  await expect(async () => {
    await page.reload();
    await expect(page.locator("tbody tr a").first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 60_000 });

  await page.getByRole("link", { name: "Ask OpsAgent" }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await page.getByLabel("Message").fill("what's newest?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Looking at list_findings…")).toBeVisible();
  const cite = page.getByRole("link", { name: new RegExp(`^finding:${UUID}$`) });
  await expect(cite).toBeVisible();
  await expect(cite).toHaveAttribute("href", new RegExp(`^/findings/${UUID}$`));
  await expect(page.locator("main")).toContainText("Your newest finding is finding:");

  // The session is listed and its history reloads.
  await page.reload();
  await page.getByRole("button", { name: "what's newest?" }).click();
  await expect(page.getByRole("link", { name: new RegExp(`^finding:${UUID}$`) })).toBeVisible();
  await cite.click();
  await expect(page).toHaveURL(new RegExp(`/findings/${UUID}$`));
});

test("ask about this finding opens chat prefilled", async ({ page, request }) => {
  await signUp(page, request);
  const id = "0b9d6f7e-3c1a-4e2b-9f00-1234567890ab";
  await page.goto(`/chat?finding=${id}`);
  await expect(page.getByLabel("Message")).toHaveValue(`About finding:${id}: `);
});

test("chat shows ask-an-owner when AI is off", async ({ page, request }) => {
  await signUp(page, request);
  sql(`UPDATE members SET role = 'member' WHERE organisation_id = ${NEWEST_ORG}`);
  await page.goto("/chat");
  await expect(page.getByText("Ask an owner to turn on Dashboard AI")).toBeVisible();
  await page.getByLabel("Message").fill("hello");
  await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();
});

test("prefill ignores a finding param that is not a uuid", async ({ page, request }) => {
  await signUp(page, request);
  await page.goto("/chat?finding=x%3Cb%3E");
  await expect(page.getByLabel("Message")).toHaveValue("");
});

test("a stream that breaks after the first delta keeps the message and the partial answer", async ({ page, request }) => {
  await signUp(page, request);
  sql(`UPDATE organisations SET ai_enabled = true WHERE id = ${NEWEST_ORG}`);
  // The message POST gets a body that sends one delta, then fails like a dropped connection.
  await page.addInitScript(() => {
    const real = window.fetch;
    window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (!/\/chat\/sessions\/[^/]+\/messages$/.test(url)) return real(input, init);
      const body = new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(new TextEncoder().encode('event: delta\ndata: {"text":"Half an answer"}\n\n'));
          setTimeout(() => c.error(new TypeError("network error")), 50);
        },
      });
      return Promise.resolve(new Response(body, { headers: { "content-type": "text/event-stream" } }));
    };
  });
  await page.goto("/chat");
  await page.getByLabel("Message").fill("will this break?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Half an answer")).toBeVisible();
  await expect(page.locator("article").getByText("will this break?", { exact: true })).toBeVisible();
  await expect(page.getByText("Partial answer")).toBeVisible();
  await expect(page.locator("main").getByRole("alert")).toContainText("network error");
  await expect(page.getByLabel("Message")).toHaveValue("");
});
