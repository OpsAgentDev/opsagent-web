import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { MenuToggle } from "@/components/marketing/MenuToggle";

export const NAV: { href: string; label: string }[] = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs/connect-your-agent", label: "Docs" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-bar">
        <Link href="/" className="brand" aria-label="OpsAgent">
          <Logo size={26} />
        </Link>
        <MenuToggle links={NAV} />
      </div>
    </header>
  );
}
