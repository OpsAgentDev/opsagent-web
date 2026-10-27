import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://opsagent.dev"),
  title: "OpsAgent: your ops teammate that never sleeps",
  description:
    "A read-only ops agent for your cloud: urgent problems reach you, everything else waits for a calm morning briefing.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
