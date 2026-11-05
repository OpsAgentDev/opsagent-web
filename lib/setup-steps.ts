// Pure logic for the dashboard setup checklist; the component only renders it. Spec: ArchBoss docs/tech-spec/first-run.md.
export type StepId = "org" | "trial" | "aws" | "scan" | "delivery" | "passkey";
export type StepState = "done" | "current" | "upcoming";
export type Step = { id: StepId; state: StepState; optional: boolean };

/** `null` means the read failed or has not loaded: that step stays open. */
export type SetupInputs = {
  billing: { enforced: boolean; status: string } | null;
  connections: number | null;
  scanned: boolean | null;
  delivery: boolean | null;
  hasPasskey: boolean;
};

// The states in which Billing offers "Start free trial".
const NO_TRIAL = new Set(["none", "canceled", "trial_ended"]);

/** Ordered steps; the first open required step is current, the optional passkey step only when none is. */
export function setupSteps(i: SetupInputs): Step[] {
  const hasConnection = (i.connections ?? 0) > 0;
  const rows: { id: StepId; done: boolean; optional?: boolean }[] = [{ id: "org", done: true }];
  if (i.billing?.enforced) rows.push({ id: "trial", done: !NO_TRIAL.has(i.billing.status) });
  rows.push({ id: "aws", done: hasConnection });
  if (hasConnection) rows.push({ id: "scan", done: i.scanned === true }, { id: "delivery", done: i.delivery === true });
  if (!i.hasPasskey) rows.push({ id: "passkey", done: false, optional: true });

  let currentTaken = false;
  return rows.map((r) => {
    const optional = r.optional ?? false;
    const state: StepState = r.done ? "done" : !currentTaken ? "current" : "upcoming";
    if (state === "current") currentTaken = true;
    return { id: r.id, state, optional };
  });
}

/** True while any non-optional step is open. */
export const requiredOpen = (steps: Step[]): boolean => steps.some((s) => !s.optional && s.state !== "done");
