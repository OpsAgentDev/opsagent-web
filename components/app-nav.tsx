"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import {
  BellIcon, ChatSquareIcon, CheckIcon, CostIcon, FlagIcon, GpuIcon, GridIcon, KeyIcon, MailIcon, ShieldIcon, UserKeyIcon, UsersIcon,
} from "@/components/marketing/landing-icons";
import { OrgSwitcher, type OrgChoice } from "@/components/org-switcher";
import { SignOut } from "@/components/sign-out";
import { useDismiss } from "@/lib/use-dismiss";

type NavLink = { href: string; label: string; icon: ReactNode };

export const APP_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: <GridIcon size={18} /> },
  { href: "/findings", label: "Findings", icon: <FlagIcon size={18} /> },
  { href: "/chat", label: "Ask OpsAgent", icon: <ChatSquareIcon size={18} /> },
  { href: "/deliveries", label: "Deliveries", icon: <MailIcon size={18} /> },
];
export const SETTINGS_LINKS: NavLink[] = [
  { href: "/settings/delivery", label: "Delivery settings", icon: <BellIcon size={18} /> },
  { href: "/settings/agents", label: "Connected agents", icon: <KeyIcon size={18} /> },
  { href: "/settings/security", label: "Security", icon: <ShieldIcon size={18} /> },
  { href: "/settings/members", label: "Members", icon: <UsersIcon size={18} /> },
  { href: "/settings/billing", label: "Billing", icon: <CostIcon size={18} /> },
  { href: "/settings/ai", label: "AI", icon: <GpuIcon size={18} /> },
  { href: "/settings/human-review", label: "Human review", icon: <CheckIcon size={18} /> },
  { href: "/settings/account", label: "Account", icon: <UserKeyIcon size={18} /> },
];

const within = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** The signed-in frame: a left sidebar (a drawer on phones), a top bar with the organisation switcher, then the page. */
export function AppShell({ email, orgs, current, children }: { email: string; orgs: OrgChoice[]; current: OrgChoice; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const drawer = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);
  useDismiss(open, close, drawer, button);
  useEffect(() => setOpen(false), [pathname]);
  // The drawer sits before the button in the page, so focus is moved into it.
  useEffect(() => {
    if (open) drawer.current?.querySelector("a")?.focus();
  }, [open]);

  const link = (l: NavLink) => (
    <Link key={l.href} href={l.href} onClick={close} aria-current={within(pathname, l.href) ? "page" : undefined}>
      {l.icon}
      {l.label}
    </Link>
  );
  const title = [...APP_LINKS, ...SETTINGS_LINKS].find((l) => within(pathname, l.href))?.label;

  return (
    <div className="app shell">
      {open && <div className="drawer-backdrop" aria-hidden="true" />}
      <aside id="app-menu" ref={drawer} className={open ? "sidebar open" : "sidebar"}>
        <div className="sidebar-head">
          <Link href="/dashboard" className="brand" aria-label="OpsAgent" onClick={close}>
            <Logo size={22} />
          </Link>
          <button type="button" className="quiet drawer-close" onClick={() => { close(); button.current?.focus(); }}>Close menu</button>
        </div>
        <nav aria-label="Main">
          {APP_LINKS.map(link)}
          <p className="nav-label" id="nav-settings">Settings</p>
          <div role="group" aria-labelledby="nav-settings">{SETTINGS_LINKS.map(link)}</div>
        </nav>
        <div className="sidebar-foot">
          <span className="account-email" title={email}>{email}</span>
          <SignOut className="quiet" />
        </div>
      </aside>
      <div className="content">
        <header className="top-bar">
          <button ref={button} type="button" className="menu-button" aria-expanded={open} aria-controls="app-menu" onClick={() => setOpen(!open)}>
            Menu
          </button>
          <OrgSwitcher orgs={orgs} current={current} />
          {title && <span className="top-title" aria-hidden="true">{title}</span>}
          <span className="account-email" title={email}>{email}</span>
        </header>
        {children}
      </div>
    </div>
  );
}
