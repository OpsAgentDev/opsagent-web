import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <Logo size={26} />
      </Link>
      <nav aria-label="Main">
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/#what-it-checks">What it checks</Link>
        <Link href="/sign-in" className="sign-in">
          Sign in
        </Link>
      </nav>
    </header>
  );
}
