import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FirstTouch } from "@/components/marketing/FirstTouch";
import { Analytics } from "@/components/marketing/Analytics";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import "./marketing.css";

// "./" resolves to each page's own path, so query strings such as /contact?topic=security canonicalise to /contact.
export const metadata: Metadata = {
  robots: { index: true, follow: true },
  alternates: { canonical: "./" },
  // Setting openGraph here replaces the root opengraph-image file, so the image is named again.
  openGraph: { type: "website", url: "./", images: ["/opengraph-image.png"] },
  twitter: { card: "summary_large_image", images: ["/opengraph-image.png"] },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mkt">
      <SiteHeader />
      {children}
      <SiteFooter />
      <Analytics />
      <FirstTouch />
    </div>
  );
}
