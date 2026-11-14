"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import {
  BellIcon, ChatSquareIcon, CheckIcon, CostIcon, FlagIcon, GpuIcon, GridIcon, KeyIcon, MailIcon, ShieldIcon, UserKeyIcon, UsersIcon,
} from "@/components/marketing/landing-icons";
import { OrgSwitcher, type OrgChoice } from "@/components/org-switcher";
import { SignOut } from "@/components/sign-out";
import { ThemeSwitch } from "@/components/theme-switch";
import { orgHref, splitOrgPath } from "@/lib/org-path";
import { useDismiss } from "@/lib/use-dismiss";

type NavLink = { href: string; label: string; icon: ReactNode };

const HOME: NavLink = { href: "/dashboard", label: "Dashboard", icon: <GridIcon size={18} /> };
/** The sidebar's groups, each under its own label. */
export const NAV_GROUPS: { id: string; label: string; links: NavLink[] }[] = [
  { id: "monitoring", label: "Monitoring", links: [
    { href: "/findings", label: "Findings", icon: <FlagIcon size={18} /> },
    { href: "/chat", label: "Ask OpsAgent", icon: <ChatSquareIcon size={18} /> },
    { href: "/deliveries", label: "Deliveries", icon: <MailIcon size={18} /> },
  ] },
  { id: "organisation", label: "Organisation", links: [
    { href: "/settings/members", label: "Members", icon: <UsersIcon size={18} /> },
    { href: "/settings/billing", label: "Billing", icon: <CostIcon size={18} /> },
    { href: "/settings/delivery", label: "Delivery settings", icon: <BellIcon size={18} /> },
    { href: "/settings/agents", label: "Connected agents", icon: <KeyIcon size={18} /> },
    { href: "/settings/ai", label: "AI", icon: <GpuIcon size={18} /> },
    { href: "/settings/human-review", label: "Human review", icon: <CheckIcon size={18} /> },
  ] },
  { id: "profile", label: "Profile", links: [
    { href: "/settings/security", label: "Security", icon: <ShieldIcon size={18} /> },
    { href: "/settings/account", label: "Account", icon: <UserKeyIcon size={18} /> },
  ] },
];

const COLLAPSED = "opsagent.sidebar-collapsed";
const CLOSED = "opsagent.nav-closed";
const Chevron = () => <svg className="chev" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" /></svg>;
const within = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** The signed-in frame: a left sidebar (a drawer on phones), a top bar with the organisation switcher, then the page. */
export function AppShell({ email, orgs, current, children }: { email: string; orgs: OrgChoice[]; current: OrgChoice & { role?: string }; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = splitOrgPath(usePathname()).path;
  const to = (path: string) => orgHref(current.slug, path);
  const drawer = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);
  // Desktop: the sidebar folds to its icons; remembered per browser (storage may be blocked).
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { try { setCollapsed(localStorage.getItem(COLLAPSED) === "1"); } catch { /* stays open */ } }, []);
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
    try { localStorage.setItem(COLLAPSED, collapsed ? "0" : "1"); } catch { /* not remembered */ }
  };
  useDismiss(open, close, drawer, button);
  useEffect(() => setOpen(false), [pathname]);
  // The drawer sits before the button in the page, so focus is moved into it.
  useEffect(() => {
    if (open) drawer.current?.querySelector("a")?.focus();
  }, [open]);

  // Groups fold under their label; the closed ones are remembered per browser. A folded sidebar shows every icon.
  const [closed, setClosed] = useState<string[]>([]);
  useEffect(() => { try { setClosed((localStorage.getItem(CLOSED) ?? "").split(",").filter(Boolean)); } catch { /* all open */ } }, []);
  const toggleGroup = (id: string) => {
    const next = closed.includes(id) ? closed.filter((g) => g !== id) : [...closed, id];
    setClosed(next);
    try { localStorage.setItem(CLOSED, next.join(",")); } catch { /* not remembered */ }
  };

  // The signed-in person's menu (theme, sign out) opens above their row.
  const [userOpen, setUserOpen] = useState(false);
  const userMenu = useRef<HTMLDivElement>(null);
  const userButton = useRef<HTMLButtonElement>(null);
  useDismiss(userOpen, () => setUserOpen(false), userMenu, userButton);

  // One marker behind the current link; it slides when the page changes (the stylesheet animates the move).
  const nav = useRef<HTMLElement>(null);
  const [mark, setMark] = useState<{ y: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const at = nav.current?.querySelector<HTMLElement>('a[aria-current="page"]');
    setMark(at ? { y: at.offsetTop, h: at.offsetHeight } : null);
  }, [pathname, open]);

  const link = (l: NavLink) => (
    <Link key={l.href} href={to(l.href)} onClick={close} aria-current={within(pathname, l.href) ? "page" : undefined} title={collapsed ? l.label : undefined}>
      {l.icon}
      <span>{l.label}</span>
    </Link>
  );
  const toggle = (
    <button type="button" className="quiet sidebar-toggle" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} aria-controls="app-menu" onClick={toggleCollapsed}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="1.75" y="2.75" width="12.5" height="10.5" rx="2" /><path d="M6 3v10" /></svg>
    </button>
  );
  const title = [HOME, ...NAV_GROUPS.flatMap((g) => g.links)].find((l) => within(pathname, l.href))?.label;

  return (
    <div className="app shell" data-collapsed={collapsed || undefined}>
      {open && <div className="drawer-backdrop" aria-hidden="true" />}
      <aside id="app-menu" ref={drawer} className={open ? "sidebar open" : "sidebar"}>
        <div className="sidebar-head">
          <Link href={to("/dashboard")} className="brand" aria-label="OpsAgent" onClick={close}>
            <Logo size={22} />
          </Link>
          {!collapsed && toggle}
          <button type="button" className="quiet drawer-close" onClick={() => { close(); button.current?.focus(); }}>Close menu</button>
        </div>
        <nav ref={nav} aria-label="Main">
          {mark && <span className="nav-mark" aria-hidden="true" style={{ transform: `translateY(${mark.y}px)`, height: mark.h }} />}
          {link(HOME)}
          {NAV_GROUPS.map((g) => (
            <div key={g.id} role="group" aria-labelledby={`nav-${g.id}`}>
              <button type="button" className="nav-label" id={`nav-${g.id}`} aria-expanded={!closed.includes(g.id)} onClick={() => toggleGroup(g.id)}>
                {g.label}
                <Chevron />
              </button>
              {/* A closed group still shows the page you are on. */}
              {g.links.filter((l) => collapsed || !closed.includes(g.id) || within(pathname, l.href)).map(link)}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          {userOpen && (
            <div id="user-menu" ref={userMenu} className="user-menu">
              <span className="account-email" title={email}>{email}</span>
              <ThemeSwitch />
              <SignOut className="quiet" />
            </div>
          )}
          <button ref={userButton} type="button" className="user-row" aria-label={`Account: ${email}`} aria-expanded={userOpen} aria-controls="user-menu" onClick={() => setUserOpen(!userOpen)}>
            <span className="avatar" aria-hidden="true">{email.charAt(0).toUpperCase()}</span>
            <span className="who">
              <span className="account-email">{email}</span>
              {current.role && <span className="role">{current.role.charAt(0).toUpperCase() + current.role.slice(1)}</span>}
            </span>
            <Chevron />
          </button>
        </div>
      </aside>
      <div className="content">
        <header className="top-bar">
          <button ref={button} type="button" className="menu-button" aria-expanded={open} aria-controls="app-menu" onClick={() => setOpen(!open)}>
            Menu
          </button>
          {collapsed && toggle}
          <OrgSwitcher orgs={orgs} current={current} />
          {title && <span className="top-title" aria-hidden="true">{title}</span>}
          <span className="account-email" title={email}>{email}</span>
        </header>
        {children}
      </div>
    </div>
  );
}
