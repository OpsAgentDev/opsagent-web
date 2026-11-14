import { describe, expect, it } from "vitest";
import { onboardingStep, onboardingSteps, type OnboardingInputs } from "@/lib/onboarding";

const fresh: OnboardingInputs = { termsAccepted: false, afterTerms: false, hasOrg: false };
const accepted = { termsAccepted: true, afterTerms: true };

describe("onboardingStep", () => {
  const step = (over: Partial<OnboardingInputs> = {}) => onboardingStep({ ...fresh, ...over });

  it("shows terms while they are not accepted, with or without an organisation", () => {
    expect(step()).toBe("terms");
    expect(step({ hasOrg: true })).toBe("terms");
  });

  it("goes from terms straight to the organisation: the passkey is not a step", () => {
    expect(step({ ...accepted })).toBe("org");
    expect(step({ termsAccepted: true })).toBe("org");
  });

  it("opens the app once terms are accepted and an organisation exists", () => {
    expect(step({ ...accepted, hasOrg: true })).toBeNull();
    expect(step({ termsAccepted: true, hasOrg: true })).toBeNull();
  });
});

describe("onboardingSteps", () => {
  const steps = (over: Partial<OnboardingInputs> = {}) => onboardingSteps({ ...fresh, ...over });

  it("is two steps for a new account and stays two through the flow", () => {
    expect(steps()).toEqual(["terms", "org"]);
    expect(steps({ ...accepted })).toEqual(["terms", "org"]);
  });

  it("is one step when only one is open", () => {
    expect(steps({ hasOrg: true })).toEqual(["terms"]);
    expect(steps({ termsAccepted: true })).toEqual(["org"]);
  });

  it("is empty when nothing is open", () => {
    expect(steps({ termsAccepted: true, hasOrg: true })).toEqual([]);
  });
});
