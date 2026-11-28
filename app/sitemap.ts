import type { MetadataRoute } from "next";
import { COMPARE } from "@/lib/marketing/compare";
import { PROBLEMS } from "@/lib/marketing/problems";

// Public marketing pages only; app and auth routes are noindex.
const PATHS = [
  "", "/pricing", "/how-it-works", "/security", "/contact", "/privacy", "/terms", "/status",
  "/features/checks", "/features/alerts", "/features/agents", "/features/ai-and-review",
  "/docs/connect-your-agent", "/sample-report", "/tools/security-group-check", "/tools/iam-credential-report-check", ...COMPARE.map((c) => `/compare/${c.slug}`), ...PROBLEMS.map((p) => `/problems/${p.slug}`),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((p) => ({ url: `https://opsagent.dev${p}` }));
}
