// Pure logic for the full-screen onboarding flow; the components only render it. Spec: ArchBoss docs/tech-spec/app-shell-2.md.
export type OnboardingStep = "terms" | "passkey" | "org";

export type OnboardingInputs = {
  termsAccepted: boolean;
  /** The terms were accepted in this page session: the passkey step shows once, right after them. */
  afterTerms: boolean;
  hasPasskey: boolean;
  passkeySupported: boolean;
  /** "Skip for now" or the card's "Not now" within the last 30 days. */
  passkeyDismissed: boolean;
  hasOrg: boolean;
};

/** The step to show, or null when the app opens. The passkey step never shows without WebAuthn. */
export function onboardingStep(i: OnboardingInputs): OnboardingStep | null {
  if (!i.termsAccepted) return "terms";
  if (i.afterTerms && !i.hasPasskey && i.passkeySupported && !i.passkeyDismissed) return "passkey";
  return i.hasOrg ? null : "org";
}

/** The steps of this person's flow in order, for "Step n of m". Empty when no step is open. */
export function onboardingSteps(i: OnboardingInputs): OnboardingStep[] {
  const step = onboardingStep(i);
  if (!step) return [];
  // While on terms the passkey step is still ahead; on the organisation step it was passed if the flow began at terms.
  const passkey = step === "passkey" || (i.passkeySupported && (step === "terms" ? !i.hasPasskey && !i.passkeyDismissed : i.afterTerms));
  const all: OnboardingStep[] = ["terms", "passkey", "org"];
  return all.filter((s) => (s === "passkey" ? passkey : s === "org" ? !i.hasOrg : true));
}
