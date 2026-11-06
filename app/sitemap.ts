import type { MetadataRoute } from "next";

// Public marketing pages only; app and auth routes are noindex.
const PATHS = [
  "", "/pricing", "/how-it-works", "/security", "/contact", "/privacy", "/terms",
  "/features/checks", "/features/alerts", "/features/agents", "/features/ai-and-review",
  "/docs/connect-your-agent",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((p) => ({ url: `https://opsagent.dev${p}` }));
}
