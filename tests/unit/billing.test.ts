import { expect, test } from "vitest";
import { planLine } from "@/lib/billing";

test("the plan line names the tier, the trial, or what is wrong", () => {
  expect(planLine(null)).toBeNull();
  expect(planLine(undefined)).toBeNull();
  expect(planLine({ status: "none", tier: null })).toBe("No plan");
  expect(planLine({ status: "trial_ended", tier: "team" })).toBe("No plan");
  expect(planLine({ status: "trialing", tier: "team" })).toBe("Team trial");
  expect(planLine({ status: "trialing", tier: null })).toBe("Trial");
  expect(planLine({ status: "active", tier: "scale" })).toBe("Scale plan");
  expect(planLine({ status: "active", tier: null })).toBeNull();
  expect(planLine({ status: "past_due", tier: "team" })).toBe("Payment failed");
  expect(planLine({ status: "paused", tier: "team" })).toBe("Paused");
});
