import Link from "next/link";
import { FooterBadges } from "@/components/marketing/FooterBadges";
import { NAV } from "@/components/marketing/SiteHeader";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>OpsAgent is a product of Binary Labs LLC.</p>
      <nav aria-label="Footer" className="site-footer-links">
        {[...NAV, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }, { href: "/status", label: "Status" }].map((l) => (
          <Link key={l.href} href={l.href}>{l.label}</Link>
        ))}
      </nav>
      <FooterBadges />
    </footer>
  );
}
