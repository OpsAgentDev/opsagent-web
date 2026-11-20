"use client";
import { usePathname } from "next/navigation";
import { OrgLink } from "@/components/org-link";
import { HUMAN_REVIEW } from "@/lib/human-review";
import { useOrg } from "@/lib/org";
import { splitOrgPath } from "@/lib/org-path";

/** Organisation settings: one page, each part a tab at its own address. `ownerOnly` tabs are hidden from members. */
export const SETTINGS_TABS: { href: string; label: string; ownerOnly?: boolean }[] = [
  { href: "/settings/members", label: "Members" },
  { href: "/settings/billing", label: "Billing" },
  { href: "/settings/delivery", label: "Delivery" },
  { href: "/settings/agents", label: "Connected agents" },
  { href: "/settings/ai", label: "AI" },
  ...(HUMAN_REVIEW ? [{ href: "/settings/human-review", label: "Human review" }] : []),
  { href: "/settings/audit", label: "Audit log", ownerOnly: true },
];

/** The tab row above an organisation settings page; nothing on the personal ones (Security, Account). */
export function SettingsTabs() {
  const path = splitOrgPath(usePathname()).path;
  const owner = useOrg().role === "owner";
  if (!SETTINGS_TABS.some((t) => path.startsWith(t.href))) return null;
  return (
    <nav aria-label="Organisation settings" className="settings-tabs">
      {SETTINGS_TABS.filter((t) => owner || !t.ownerOnly).map((t) => (
        <OrgLink key={t.href} href={t.href} aria-current={path.startsWith(t.href) ? "page" : undefined}>{t.label}</OrgLink>
      ))}
    </nav>
  );
}
