import { api, ApiError, unwrap, type Billing } from "@/lib/api/client";

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

/** The short plan line under the organisation's name; null when billing isn't set up or isn't read yet. */
export function planLine(b: Pick<Billing, "status" | "tier"> | null | undefined): string | null {
  if (!b) return null;
  const tier = (b.tier && TIERS[b.tier]) || "";
  switch (b.status) {
    case "trialing": return `${tier} trial`.trim().replace(/^t/, "T");
    case "active": return tier ? `${tier} plan` : null;
    case "past_due": return "Payment failed";
    case "paused": return "Paused";
    default: return "No plan"; // none, canceled, trial_ended
  }
}

/** Navigates to a Stripe-hosted page; refuses any other URL. */
export function goToStripe(url: string): void {
  const u = new URL(url);
  if (u.protocol !== "https:" || !STRIPE_HOSTS.has(u.host)) throw new Error("Unexpected billing redirect.");
  window.location.assign(u.toString());
}
