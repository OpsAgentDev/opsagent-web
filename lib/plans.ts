export type Plan = { id: string; name: string; price: string; trial: boolean; members: string; integrations: string; aiCredits: string };

/** The three tiers as the pricing page and the upgrade dialog show them, cheapest first. */
export const PLANS: Plan[] = [
  { id: "starter", name: "Starter", trial: false, price: "$99", members: "2", integrations: "1", aiCredits: "1,000" },
  { id: "team", name: "Team", trial: true, price: "$299", members: "5", integrations: "Unlimited", aiCredits: "5,000" },
  { id: "scale", name: "Scale", trial: false, price: "$599", members: "Unlimited", integrations: "Unlimited", aiCredits: "15,000" },
];

/** Stripe prices are tax-exclusive; shown under every list of plan prices. */
export const PRICE_NOTE = "Prices in US dollars, plus tax where applicable.";

export const PLAN_FEATURES = [
  ["Members", "members"],
  ["Slack workspaces", "integrations"],
  ["AI credits per cloud account per month", "aiCredits"],
] as const;
