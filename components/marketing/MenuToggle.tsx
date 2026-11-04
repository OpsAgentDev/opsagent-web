"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Holds the nav links too: aria-current needs the pathname, and the panel needs the open state.
type NavLink = { href: string; label: string };

export function MenuToggle({ features, links }: { features: NavLink[]; links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => { setOpen(false); setMore(false); }, [pathname]);

  useEffect(() => {
    if (!open && !more) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (more) {
        setMore(false);
        moreButton.current?.focus();
        return;
      }
      setOpen(false);
      button.current?.focus();
    };
    const onClick = (e: MouseEvent) => {
      if (root.current?.contains(e.target as Node)) return;
      setOpen(false);
      setMore(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open, more]);

  const inFeatures = features.some((l) => l.href === pathname);
  const close = () => { setOpen(false); setMore(false); };
  // Hover opens the dropdown on desktop only (a hover-capable pointer and the bar layout, not the phone menu).
  const hoverOpen = () => window.matchMedia("(hover: hover) and (min-width: 861px)").matches;
  const leave = useRef<ReturnType<typeof setTimeout>>(undefined);
  const enter = () => {
    if (!hoverOpen()) return;
    clearTimeout(leave.current);
    setMore(true);
  };
  const out = () => {
    if (!hoverOpen()) return;
    leave.current = setTimeout(() => setMore(false), 150);
  };
  const link = (l: NavLink) => (
    <Link key={l.href} href={l.href} onClick={close} aria-current={pathname === l.href ? "page" : undefined}>
      {l.label}
    </Link>
  );

  return (
    <div className="menu" ref={root}>
      <button ref={button} type="button" className="menu-button" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(!open)}>
        {open ? "Close menu" : "Menu"}
      </button>
      <nav id="site-menu" aria-label="Main" className={open ? "open" : undefined}>
        <div className="more" onMouseEnter={enter} onMouseLeave={out}>
          <button ref={moreButton} type="button" className="more-button" aria-expanded={more} aria-controls="site-more" aria-current={inFeatures ? "true" : undefined} onClick={() => setMore(hoverOpen() ? true : !more)}>
            Features <span aria-hidden="true">▾</span>
          </button>
          <div id="site-more" className={more ? "more-panel open" : "more-panel"}>
            <p className="more-label">Features</p>
            {features.map(link)}
          </div>
        </div>
        {links.map(link)}
        <Link href="/sign-in" className="sign-in" onClick={close}>Sign in</Link>
        <Link href="/#waitlist" className="join" onClick={close}>Join the waitlist</Link>
      </nav>
    </div>
  );
}
