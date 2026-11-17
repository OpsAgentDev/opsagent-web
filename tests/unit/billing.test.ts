import { expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BillingBanner } from "@/components/billing-banner";
import { accountsLine, daysLeftText, planLine, upgradePlans } from "@/lib/billing";

const now = Date.parse("2026-11-16T12:00:00Z");
const inDays = (d: number) => new Date(now + d * 864e5).toISOString();

test("the plan line names the tier, the trial's days left, or what is wrong", () => {
  expect(planLine(null)).toBeNull();
  expect(planLine(undefined)).toBeNull();
  expect(planLine({ status: "none", tier: null })).toBe("No plan");
  expect(planLine({ status: "trial_ended", tier: "team" })).toBe("No plan");
  expect(planLine({ status: "trialing", tier: "team", trial_ends_at: inDays(10) }, now)).toBe("Free trial · 10 days left");
  expect(planLine({ status: "trialing", tier: "team", trial_ends_at: inDays(0.5) }, now)).toBe("Free trial · 1 day left");
  expect(planLine({ status: "trialing", tier: "team", trial_ends_at: inDays(-0.1) }, now)).toBe("Free trial · last day");
  expect(planLine({ status: "trialing", tier: null }, now)).toBe("Free trial");
  expect(planLine({ status: "trialing", tier: "team", trial_ends_at: inDays(3), cancel_at_period_end: true }, now)).toMatch(/^Free trial · ends /);
  expect(planLine({ status: "active", tier: "scale" })).toBe("Scale");
  expect(planLine({ status: "active", tier: "team" })).toBe("Team");
  expect(planLine({ status: "active", tier: null })).toBeNull();
  expect(planLine({ status: "past_due", tier: "team" })).toBe("Payment failed");
  expect(planLine({ status: "paused", tier: "team" })).toBe("Paused");
});

test("an upgrade is offered only to a running, enforced plan below Scale, nearest tier first", () => {
  const ids = (b: Parameters<typeof upgradePlans>[0]) => upgradePlans(b).map((p) => p.id);
  expect(ids({ status: "trialing", tier: "team", enforced: true })).toEqual(["scale"]);
  expect(ids({ status: "active", tier: "team", enforced: true })).toEqual(["scale"]);
  expect(ids({ status: "active", tier: "starter", enforced: true })).toEqual(["team", "scale"]);
  expect(ids({ status: "active", tier: "scale", enforced: true })).toEqual([]);
  expect(ids({ status: "active", tier: "team", enforced: false })).toEqual([]);
  for (const status of ["none", "past_due", "paused", "canceled", "trial_ended"]) expect(ids({ status, tier: "team", enforced: true })).toEqual([]);
  expect(ids({ status: "active", tier: null, enforced: true })).toEqual([]);
  expect(ids(null)).toEqual([]);
});

test("days left are counted in words", () => {
  expect(daysLeftText(2)).toBe("2 days left");
  expect(daysLeftText(1)).toBe("1 day left");
  expect(daysLeftText(0)).toBe("last day");
});

test("the billed line says so when no cloud account is connected yet", () => {
  expect(accountsLine("Team", 1, 0)).toBe("No cloud account connected yet. Team is billed per connected cloud account.");
  expect(accountsLine("Team", 1, 1)).toBe("1 cloud account billed on Team");
  expect(accountsLine("Scale", 3, 3)).toBe("3 cloud accounts billed on Scale");
  expect(accountsLine("Team", 1)).toBe("1 cloud account billed on Team"); // connections unreadable
});

test("the start banner is not shown on the Billing page; the other notices are", () => {
  const banner = (status: string, onBilling: boolean) =>
    renderToStaticMarkup(createElement(BillingBanner, { onBilling, data: { status, enforced: true, over_limit: false, quantity: 0, cancel_at_period_end: false, trial_available: true } }));
  expect(banner("none", false)).toContain("Start your free trial to turn on checks.");
  expect(banner("none", true)).toBe("");
  expect(banner("trial_ended", true)).toContain("OpsAgent is paused.");
});
