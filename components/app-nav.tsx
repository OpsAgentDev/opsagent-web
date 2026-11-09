"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { BellIcon, ChatSquareIcon, CostIcon, FlagIcon, ShieldIcon, UserKeyIcon } from "@/components/marketing/landing-icons";

type NavLink = { href: string; label: string; icon?: ReactNode };

/** Plain links in the bar. */
export const APP_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/findings", label: "Findings" },
  { href: "/chat", label: "Ask OpsAgent" },
  { href: "/deliveries", label: "Deliveries" },
];
/** Under the "Settings" dropdown (flat under a "Settings" label in the phone menu). */
export const SETTINGS_LINKS: NavLink[] = [
  { href: "/settings/delivery", label: "Delivery settings", icon: <BellIcon size={18} /> },
  { href: "/settings/agents", label: "Connected agents", icon: <UserKeyIcon size={18} /> },
  { href: "/settings/security", label: "Security", icon: <ShieldIcon size={18} /> },
  { href: "/settings/billing", label: "Billing", icon: <CostIcon size={18} /> },
  { href: "/settings/ai", label: "AI", icon: <ChatSquareIcon size={18} /> },
  { href: "/settings/human-review", label: "Human review", icon: <FlagIcon size={18} /> },
];

const within = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** The dashboard's top bar. Same open/close behaviour as the marketing header's MenuToggle. */
export function AppNav({ org, email }: { org?: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);

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
    <Link key={l.href} href={l.href} onClick={close} aria-current={within(pathname, l.href) ? "page" : undefined}>
      {l.icon}
      {l.label}
    </Link>
  );
  const inSettings = SETTINGS_LINKS.some((l) => within(pathname, l.href));

  return (
    <header className="app-bar bar">
      {/* Outside `root`, so the document click handler closes the menu; it also stops that tap reaching the page. */}
      {open && <div className="menu-backdrop" aria-hidden="true" />}
      <div className="app-bar-inner" ref={root}>
        <Link href="/dashboard" className="brand" aria-label="OpsAgent">
          <Logo size={22} />
        </Link>
        <button ref={button} type="button" className="menu-button" aria-expanded={open} aria-controls="app-menu" onClick={() => setOpen(!open)}>
          {open ? "Close menu" : "Menu"}
        </button>
        <nav id="app-menu" aria-label="Main" className={open ? "open" : undefined}>
          {APP_LINKS.map(link)}
          <div className="more" onMouseEnter={enter} onMouseLeave={out}>
            <button ref={moreButton} type="button" className="more-button" aria-expanded={more} aria-controls="app-settings" aria-current={inSettings ? "true" : undefined} onClick={() => setMore(hoverOpen() ? true : !more)}>
              Settings <span aria-hidden="true">▾</span>
            </button>
            <div id="app-settings" className={more ? "more-panel open" : "more-panel"}>
              <p className="more-label">Settings</p>
              {SETTINGS_LINKS.map(link)}
            </div>
          </div>
          <p className="account">
            <span className="avatar" aria-hidden="true">{(org ?? email).charAt(0).toUpperCase()}</span>
            <span className="account-text">
              {org && <span className="account-org">{org}</span>}
              <span className="account-email">{email}</span>
            </span>
          </p>
        </nav>
      </div>
    </header>
  );
}
