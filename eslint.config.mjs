import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "lib/api/schema.d.ts", "playwright-report/**", "test-results/**"] },
  ...nextVitals,
  ...nextTs,
  {
    // lib/api/client.ts is the only place that talks to brain.
    ignores: ["lib/api/client.ts"],
    rules: { "no-restricted-globals": ["error", { name: "fetch", message: "Use lib/api/client.ts." }] },
  },
  { rules: { "no-console": "error" } },
  { files: ["lib/log.ts"], rules: { "no-console": "off" } },
  {
    // New in react-hooks 7 (React Compiler checks); not enforced before Next 16, and the flagged patterns are intentional.
    rules: { "react-hooks/set-state-in-effect": "off", "react-hooks/purity": "off" },
  },
];

export default config;
