import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { MenuToggle } from "@/components/marketing/MenuToggle";

type NavLink = { href: string; label: string };
/** Under the "Features" dropdown (flat under a "Features" label in the phone menu). */
export const FEATURES: NavLink[] = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/features/alerts", label: "Alerts and briefings" },
  { href: "/features/checks", label: "What it checks" },
  { href: "/features/agents", label: "Connect your agent" },
  { href: "/features/ai-and-review", label: "Dashboard AI and human review" },
];
/** Plain links in the bar, after the dropdown. */
export const LINKS: NavLink[] = [
  { href: "/security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs/connect-your-agent", label: "Docs" },
  { href: "/contact", label: "Contact" },
];
/** Every public page in the nav; the footer and the sitemap read it too. */
export const NAV: NavLink[] = [...FEATURES, ...LINKS];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-bar">
        <Link href="/" className="brand" aria-label="OpsAgent">
          <Logo size={26} />
        </Link>
        <MenuToggle features={FEATURES} links={LINKS} />
      </div>
    </header>
  );
}
