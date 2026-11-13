import { describe, expect, it } from "vitest";
import { onboardingStep, onboardingSteps, type OnboardingInputs } from "@/lib/onboarding";

const fresh: OnboardingInputs = { termsAccepted: false, afterTerms: false, hasPasskey: false, passkeySupported: true, passkeyDismissed: false, hasOrg: false };
const step = (over: Partial<OnboardingInputs> = {}) => onboardingStep({ ...fresh, ...over });
const accepted = { termsAccepted: true, afterTerms: true };

describe("onboardingStep", () => {
  it("shows terms while they are not accepted, whatever else is true", () => {
    for (const hasOrg of [true, false]) {
      for (const hasPasskey of [true, false]) {
        for (const passkeySupported of [true, false]) {
          for (const passkeyDismissed of [true, false]) {
            expect(step({ hasOrg, hasPasskey, passkeySupported, passkeyDismissed })).toBe("terms");
          }
        }
      }
    }
  });

  it("shows the passkey step right after terms when there is no passkey", () => {
    expect(step({ ...accepted })).toBe("passkey");
    expect(step({ ...accepted, hasOrg: true })).toBe("passkey");
  });

  it("skips the passkey step with a passkey, after a dismissal, or without WebAuthn", () => {
    for (const over of [{ hasPasskey: true }, { passkeyDismissed: true }, { passkeySupported: false }]) {
      expect(step({ ...accepted, ...over })).toBe("org");
      expect(step({ ...accepted, ...over, hasOrg: true })).toBeNull();
    }
  });

  it("shows the passkey step once: not on a later visit", () => {
    expect(step({ termsAccepted: true })).toBe("org");
    expect(step({ termsAccepted: true, hasOrg: true })).toBeNull();
  });

  it("an existing account with an organisation sees terms, then the app", () => {
    expect(step({ hasOrg: true, hasPasskey: true })).toBe("terms");
    expect(step({ ...accepted, hasOrg: true, hasPasskey: true })).toBeNull();
  });
});

describe("onboardingSteps", () => {
  const steps = (over: Partial<OnboardingInputs> = {}) => onboardingSteps({ ...fresh, ...over });

  it("is three steps for a new account and stays three through the flow", () => {
    expect(steps()).toEqual(["terms", "passkey", "org"]);
    expect(steps({ ...accepted })).toEqual(["terms", "passkey", "org"]);
    expect(steps({ ...accepted, passkeyDismissed: true })).toEqual(["terms", "passkey", "org"]);
    expect(steps({ ...accepted, hasPasskey: true })).toEqual(["terms", "passkey", "org"]);
  });

  it("leaves out the passkey step without WebAuthn and the organisation step with an organisation", () => {
    expect(steps({ passkeySupported: false })).toEqual(["terms", "org"]);
    expect(steps({ hasOrg: true, hasPasskey: true })).toEqual(["terms"]);
    expect(steps({ hasOrg: true })).toEqual(["terms", "passkey"]);
  });

  it("is empty when nothing is open", () => {
    expect(steps({ termsAccepted: true, hasOrg: true })).toEqual([]);
  });
});
