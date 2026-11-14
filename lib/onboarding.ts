// Pure logic for the full-screen onboarding flow; the components only render it. Spec: ArchBoss docs/tech-spec/app-shell-2.md.
export type OnboardingStep = "terms" | "org";

export type OnboardingInputs = {
  termsAccepted: boolean;
  /** The terms were accepted in this page session, so they still count as a step of this flow. */
  afterTerms: boolean;
  hasOrg: boolean;
};

/** The step to show, or null when the app opens. The optional passkey is offered on the terms step, not as a step. */
export function onboardingStep(i: OnboardingInputs): OnboardingStep | null {
  if (!i.termsAccepted) return "terms";
  return i.hasOrg ? null : "org";
}

/** The steps of this person's flow in order, for "Step n of m". Empty when no step is open. */
export function onboardingSteps(i: OnboardingInputs): OnboardingStep[] {
  if (!onboardingStep(i)) return [];
  const steps: OnboardingStep[] = [];
  if (!i.termsAccepted || i.afterTerms) steps.push("terms");
  if (!i.hasOrg) steps.push("org");
  return steps;
}
