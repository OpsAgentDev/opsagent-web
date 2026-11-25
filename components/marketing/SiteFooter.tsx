import Link from "next/link";
import { CookieSettings } from "@/components/marketing/Analytics";
import { FooterBadges } from "@/components/marketing/FooterBadges";
import { NAV } from "@/components/marketing/SiteHeader";
import { ThemeSwitch } from "@/components/theme-switch";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>OpsAgent is a product of Binary Labs LLC.</p>
      <nav aria-label="Footer" className="site-footer-links">
        {[...NAV, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }, { href: "/status", label: "Status" }, { href: "/compare/aws-devops-agent", label: "vs AWS DevOps Agent" }, { href: "/sample-report", label: "Sample report" }, { href: "/tools/security-group-check", label: "Free security group check" }].map((l) => (
          <Link key={l.href} href={l.href}>{l.label}</Link>
        ))}
        <CookieSettings />
      </nav>
      <ThemeSwitch />
      <FooterBadges />
    </footer>
  );
}
