import { api, ApiError, unwrap, type Billing } from "@/lib/api/client";
import { PLANS, type Plan } from "@/lib/plans";

const STRIPE_HOSTS = new Set(["checkout.stripe.com", "billing.stripe.com"]);

/** Billing, or null when Stripe isn't configured (brain answers 503 billing_unavailable). */
export async function loadBilling(org: string): Promise<Billing | null> {
  try {
    return await unwrap(api.GET("/orgs/{org}/billing", { params: { path: { org } } }));
  } catch (e) {
    if (e instanceof ApiError && e.status === 503) return null;
    throw e;
  }
}

export const TIERS: Record<string, string> = { starter: "Starter", team: "Team", scale: "Scale" };

/** Whole days until `iso` (0 on the last day); null without a date. */
export function daysLeft(iso: string | null | undefined, now = Date.now()): number | null {
  return iso ? Math.max(0, Math.ceil((Date.parse(iso) - now) / 864e5)) : null;
}

/** The plan line under the organisation's name; null when billing isn't set up or isn't read yet. */
export function planLine(b: (Pick<Billing, "status" | "tier" | "trial_ends_at"> & Partial<Pick<Billing, "cancel_at_period_end">>) | null | undefined, now = Date.now()): string | null {
  if (!b) return null;
  switch (b.status) {
    case "trialing": {
      // A cancelled trial won't carry on, so it shows its last day rather than a countdown.
      if (b.cancel_at_period_end && b.trial_ends_at) return `Free trial · ends ${new Date(b.trial_ends_at).toLocaleDateString()}`;
      const days = daysLeft(b.trial_ends_at, now);
      if (days === null) return "Free trial";
      return `Free trial · ${days === 0 ? "last day" : `${days} ${days === 1 ? "day" : "days"} left`}`;
    }
    case "active": return (b.tier && TIERS[b.tier]) || null;
    case "past_due": return "Payment failed";
    case "paused": return "Paused";
    default: return "No plan"; // none, canceled, trial_ended
  }
}

/** The plans an owner can move up to from the top bar, nearest first; none unless billing is enforced and the plan is running. */
export function upgradePlans(b: Pick<Billing, "status" | "tier" | "enforced"> | null | undefined): Plan[] {
  if (!b?.enforced || (b.status !== "trialing" && b.status !== "active")) return [];
  const at = PLANS.findIndex((p) => p.id === b.tier);
  return at < 0 ? [] : PLANS.slice(at + 1);
}

/** Navigates to a Stripe-hosted page; refuses any other URL. */
export function goToStripe(url: string): void {
  const u = new URL(url);
  if (u.protocol !== "https:" || !STRIPE_HOSTS.has(u.host)) throw new Error("Unexpected billing redirect.");
  window.location.assign(u.toString());
}
