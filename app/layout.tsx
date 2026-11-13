import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://opsagent.dev"),
  title: "OpsAgent: your ops teammate that never sleeps",
  description:
    "A read-only ops agent for your cloud: a full scan every night, a calm morning briefing, and urgent exposures checked every 15 minutes and alerted right away.",
  // Everything outside (marketing) is private or transactional; that layout opts back in.
  robots: { index: false, follow: false },
};

// Downloaded at build and served from this origin, so no page asks Google for a font and the CSP needs no new host.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const viewport: Viewport = { themeColor: "#F5F7FA", colorScheme: "light" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
