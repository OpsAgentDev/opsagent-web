import type { NextConfig } from "next";

// Report-Only until the inline theme script and JSON-LD are covered by a nonce or hash. Dev and e2e call brain on localhost:3000.
const connectSrc = ["'self'", "https://brain.opsagent.dev", ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000"])].join(" ");
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
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
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = { reactStrictMode: true, output: "standalone", poweredByHeader: false,
  headers: async () => [
    { source: "/:path*", headers: common },
    // The consent page must not be framed (clickjacking an Approve button).
    { source: "/oauth/consent", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" }, { key: "X-Frame-Options", value: "DENY" }] },
  ],
};

export default nextConfig;
