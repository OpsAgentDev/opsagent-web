"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Holds the nav links too: aria-current needs the pathname, and the panel needs the open state.
export function MenuToggle({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onClick = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <div className="menu" ref={root}>
      <button ref={button} type="button" className="menu-button" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(!open)}>
        {open ? "Close menu" : "Menu"}
      </button>
      <nav id="site-menu" aria-label="Main" className={open ? "open" : undefined}>
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
        <Link href="/sign-in" className="sign-in">Sign in</Link>
        <Link href="/#waitlist" className="join">Join the waitlist</Link>
      </nav>
    </div>
  );
}
