import type { NextConfig } from "next";

const nextConfig: NextConfig = { reactStrictMode: true, output: "standalone",
  // The consent page must not be framed (clickjacking an Approve button).
  headers: async () => [{ source: "/oauth/consent", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" }] }],
};

export default nextConfig;
