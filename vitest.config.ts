import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } }, // tsconfig says "preserve" for Next
  resolve: { alias: { "@": import.meta.dirname } },
  test: { include: ["tests/unit/**/*.test.ts"] },
});
