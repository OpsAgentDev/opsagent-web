import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  { ignores: [".next/**", "lib/api/schema.d.ts", "playwright-report/**", "test-results/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // lib/api/client.ts is the only place that talks to brain.
    ignores: ["lib/api/client.ts"],
    rules: { "no-restricted-globals": ["error", { name: "fetch", message: "Use lib/api/client.ts." }] },
  },
  { rules: { "no-console": "error" } },
  { files: ["lib/log.ts"], rules: { "no-console": "off" } },
];
