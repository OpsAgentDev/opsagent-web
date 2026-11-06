import type { ReactNode } from "react";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import "./marketing.css";

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
