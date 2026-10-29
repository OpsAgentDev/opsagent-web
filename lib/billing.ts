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

/** Navigates to a Stripe-hosted page; refuses any other URL. */
export function goToStripe(url: string): void {
  const u = new URL(url);
  if (u.protocol !== "https:" || !STRIPE_HOSTS.has(u.host)) throw new Error("Unexpected billing redirect.");
  window.location.assign(u.toString());
}
