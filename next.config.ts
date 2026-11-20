import type { NextConfig } from "next";

// Enforced. Brain's origin comes from the same build setting the API client uses, so dev and e2e
// (brain on localhost) are allowed without a production exception.
// shortcut: script-src keeps 'unsafe-inline' for the inline theme script and JSON-LD; move to
// nonces if a script-injection finding ever makes that worth giving up static rendering.
const brain = new URL(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000").origin;
// Cloudflare Web Analytics is injected at the edge: its script and its beacon endpoint.
// Google Analytics only when it is built in (NEXT_PUBLIC_GA_ID); it loads after the visitor accepts.
const ga = Boolean(process.env.NEXT_PUBLIC_GA_ID);
const gaConnect = ga ? ["https://*.google-analytics.com", "https://*.analytics.google.com", "https://*.googletagmanager.com"] : [];
const connectSrc = ["'self'", brain, "https://cloudflareinsights.com", ...gaConnect].join(" ");
const csp = [
  "default-src 'self'",
  // `next dev` evaluates modules for fast refresh; production never gets 'unsafe-eval'.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"} https://challenges.cloudflare.com https://static.cloudflareinsights.com${ga ? " https://www.googletagmanager.com" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "frame-src https://challenges.cloudflare.com",
  `connect-src ${connectSrc}`,
  "frame-ancestors 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const common = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Another site that opens ours (or that we open) gets no handle on this window.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = { reactStrictMode: true, output: "standalone", poweredByHeader: false,
  // In-app addresses carry the organisation (/o/<slug>/dashboard); the pages live at the path after it (lib/org-path.ts).
  // Docs has one page so far; /docs is its address in links and memory.
  redirects: async () => [{ source: "/docs", destination: "/docs/connect-your-agent", permanent: true }],
  rewrites: async () => [
    { source: "/o/:org/:section(dashboard|findings|chat|deliveries|settings|connections|onboarding)/:rest*", destination: "/:section/:rest*" },
  ],
  headers: async () => [
    { source: "/:path*", headers: common },
    // The consent page must not be framed (clickjacking an Approve button).
    { source: "/oauth/consent", headers: [{ key: "Content-Security-Policy", value: csp.replace("frame-ancestors 'self'", "frame-ancestors 'none'") }, { key: "X-Frame-Options", value: "DENY" }] },
  ],
};

export default nextConfig;
