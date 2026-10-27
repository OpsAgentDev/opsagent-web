import Link from "next/link";
import { NAV } from "@/components/marketing/SiteHeader";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>OpsAgent is a product of Binary Labs LLC.</p>
      <nav aria-label="Footer" className="site-footer-links">
        {NAV.map((l) => (
          <Link key={l.href} href={l.href}>{l.label}</Link>
        ))}
      </nav>
    </footer>
  );
}
