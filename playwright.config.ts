import { defineConfig, devices } from "@playwright/test";

// Brain and web must already be running (scripts/e2e.sh starts both).
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  retries: 0,
  // Specs share the one fake account (it backs one live connection), so they run one at a time.
  workers: 1,
  use: { baseURL: "http://localhost:3001", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
