"use client";
import Link from "next/link";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { joinCta, SIGNUPS_OPEN } from "@/lib/signups";
import { useDashboardLink } from "@/lib/use-dashboard-link";

/** The hero and closing call to action: the dashboard when signed in, else the waitlist form, or a trial link once sign-ups are open. */
export function SignupCta({ source }: { source: React.ComponentProps<typeof WaitlistForm>["source"] }) {
  const dashboard = useDashboardLink();
  if (dashboard) return <Link href={dashboard} className="trial-cta">Open dashboard</Link>;
  if (!SIGNUPS_OPEN) return <WaitlistForm source={source} />;
  const { label, href } = joinCta();
  return <Link href={href} className="trial-cta">{label}</Link>;
}
