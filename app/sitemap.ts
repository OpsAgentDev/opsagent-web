import type { MetadataRoute } from "next";
import { COMPARE } from "@/lib/marketing/compare";

// Public marketing pages only; app and auth routes are noindex.
const PATHS = [
  "", "/pricing", "/how-it-works", "/security", "/contact", "/privacy", "/terms", "/status",
  "/features/checks", "/features/alerts", "/features/agents", "/features/ai-and-review",
  "/docs/connect-your-agent", "/sample-report", ...COMPARE.map((c) => `/compare/${c.slug}`),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((p) => ({ url: `https://opsagent.dev${p}` }));
}
