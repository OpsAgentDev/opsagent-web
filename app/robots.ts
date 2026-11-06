import type { MetadataRoute } from "next";

// AI crawlers (GPTBot, ClaudeBot, PerplexityBot) stay allowed by the wildcard rule.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: "https://opsagent.dev/sitemap.xml" };
}
