import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://opsagent.dev"),
  title: "OpsAgent: your ops teammate that never sleeps",
  description:
    "A read-only ops agent for your cloud: a full scan every night, a calm morning briefing, and urgent exposures checked every 15 minutes and alerted right away.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
