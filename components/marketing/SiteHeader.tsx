import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { MenuToggle } from "@/components/marketing/MenuToggle";

type NavLink = { href: string; label: string };
/** Shown in the bar. */
export const PRIMARY: NavLink[] = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
];
/** Under the "Resources" dropdown (flat in the phone menu). */
export const RESOURCES: NavLink[] = [
  { href: "/docs/connect-your-agent", label: "Docs" },
  { href: "/contact", label: "Contact" },
];
export const NAV: NavLink[] = [...PRIMARY, ...RESOURCES];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-bar">
        <Link href="/" className="brand" aria-label="OpsAgent">
          <Logo size={26} />
        </Link>
        <MenuToggle primary={PRIMARY} resources={RESOURCES} />
      </div>
    </header>
  );
}
