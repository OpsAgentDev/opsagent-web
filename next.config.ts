import type { NextConfig } from "next";

const common = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

const nextConfig: NextConfig = { reactStrictMode: true, output: "standalone", poweredByHeader: false,
  headers: async () => [
    { source: "/:path*", headers: common },
    // The consent page must not be framed (clickjacking an Approve button).
    { source: "/oauth/consent", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" }, { key: "X-Frame-Options", value: "DENY" }] },
  ],
};

export default nextConfig;
