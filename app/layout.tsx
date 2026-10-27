import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://opsagent.dev"),
  title: "OpsAgent: your cloud, checked every night",
  description:
    "A read-only agent for teams with no ops person. Every morning you get a short briefing of what's wrong and why. It never changes anything.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
