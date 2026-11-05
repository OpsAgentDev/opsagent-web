import { describe, expect, it } from "vitest";
import { requiredOpen, setupSteps, type SetupInputs, type StepId } from "@/lib/setup-steps";

const base: SetupInputs = { billing: null, connections: 0, scanned: false, delivery: false, hasPasskey: true };
const steps = (over: Partial<SetupInputs> = {}) => setupSteps({ ...base, ...over });
const find = (over: Partial<SetupInputs>, id: StepId) => steps(over).find((s) => s.id === id);

describe("setupSteps", () => {
  it("has no trial step when billing is null", () => {
    expect(find({ billing: null }, "trial")).toBeUndefined();
  });

  it("has no trial step when billing is not enforced", () => {
    expect(find({ billing: { enforced: false, status: "none" } }, "trial")).toBeUndefined();
  });

  it("makes the trial step current when enforced and status is none", () => {
    expect(find({ billing: { enforced: true, status: "none" } }, "trial")?.state).toBe("current");
  });

  it("marks the trial step done once trialing", () => {
    expect(find({ billing: { enforced: true, status: "trialing" } }, "trial")?.state).toBe("done");
  });

  it("keeps the trial step open for canceled and trial_ended", () => {
    for (const status of ["canceled", "trial_ended"]) {
      expect(find({ billing: { enforced: true, status } }, "trial")?.state).not.toBe("done");
    }
  });

  it("makes aws current when there are no connections", () => {
    expect(find({ connections: 0 }, "aws")?.state).toBe("current");
  });

  it("hides scan and delivery when connections is 0 or null", () => {
    for (const connections of [0, null]) {
      const ids = steps({ connections }).map((s) => s.id);
      expect(ids).not.toContain("scan");
      expect(ids).not.toContain("delivery");
    }
  });

  it("marks scan done when scanned", () => {
    expect(find({ connections: 1, scanned: true }, "scan")?.state).toBe("done");
  });

  it("marks delivery done when delivery is set", () => {
    expect(find({ connections: 1, delivery: true }, "delivery")?.state).toBe("done");
  });

  it("marks the first open required step current and later ones upcoming", () => {
    const s = steps({ connections: 1 });
    expect(s.find((x) => x.id === "scan")?.state).toBe("current");
    expect(s.find((x) => x.id === "delivery")?.state).toBe("upcoming");
  });

  it("orders org, trial, aws, scan, delivery, passkey", () => {
    const ids = steps({ billing: { enforced: true, status: "none" }, connections: 1, hasPasskey: false }).map((s) => s.id);
    expect(ids).toEqual(["org", "trial", "aws", "scan", "delivery", "passkey"]);
  });

  it("adds an optional passkey step last only without a passkey", () => {
    expect(steps({ hasPasskey: true }).some((s) => s.id === "passkey")).toBe(false);
    const last = steps({ hasPasskey: false }).at(-1);
    expect(last).toMatchObject({ id: "passkey", optional: true });
  });

  it("makes the passkey step current only when no required step is open", () => {
    expect(find({ hasPasskey: false }, "passkey")?.state).toBe("upcoming");
    const done = { connections: 1, scanned: true, delivery: true, hasPasskey: false };
    expect(find(done, "passkey")?.state).toBe("current");
  });

  it("leaves a step upcoming when its read failed (null)", () => {
    const s = steps({ connections: 1, scanned: null, delivery: null });
    expect(s.find((x) => x.id === "scan")?.state).not.toBe("done");
    expect(s.find((x) => x.id === "delivery")?.state).not.toBe("done");
    expect(find({ connections: null }, "aws")?.state).not.toBe("done");
  });
});

describe("requiredOpen", () => {
  it("is false when every required step is done, even with the passkey open", () => {
    const s = steps({ connections: 1, scanned: true, delivery: true, hasPasskey: false });
    expect(requiredOpen(s)).toBe(false);
  });

  it("is true while a required step is open", () => {
    expect(requiredOpen(steps({ connections: 0 }))).toBe(true);
  });

  it("is not made true by the passkey step", () => {
    expect(requiredOpen(steps({ connections: 1, scanned: true, delivery: true, hasPasskey: false }))).toBe(false);
  });
});
