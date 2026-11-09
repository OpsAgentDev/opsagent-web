import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import "./marketing.css";

// "./" resolves to each page's own path, so query strings such as /contact?topic=security canonicalise to /contact.
export const metadata: Metadata = {
  robots: { index: true, follow: true },
  alternates: { canonical: "./" },
  openGraph: { type: "website", url: "./" },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mkt">
      {/* Scroll reveals hide content only once this has run, so the page reads fine without JavaScript. */}
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
