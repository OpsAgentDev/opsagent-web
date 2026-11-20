import { describe, expect, it } from "vitest";
import { ACTION_LABELS, actionLabel, targetLabel } from "@/lib/audit";

describe("audit log labels", () => {
  it("labels known action codes and shows an unknown code as it is", () => {
    expect(actionLabel("connection.create")).toBe("Added a cloud account");
    expect(actionLabel("org.exported")).toBe("Exported the organisation's data");
    expect(actionLabel("something.new")).toBe("something.new");
  });
  it("every label is short, plain text for a dotted code", () => {
    for (const [code, label] of Object.entries(ACTION_LABELS)) {
      expect(code, code).toMatch(/^[a-z_]+(\.[a-z_]+)+$/);
      expect(label.length, code).toBeLessThanOrEqual(40);
      expect(label, code).not.toMatch(/[._]/);
    }
  });
  it("names the target, else its kind, else nothing", () => {
    expect(targetLabel({ target: "Production", target_type: "connection" })).toBe("Production");
    expect(targetLabel({ target: null, target_type: "connection" })).toBe("Cloud account");
    expect(targetLabel({ target: null, target_type: "widget" })).toBe("widget");
    expect(targetLabel({})).toBe("");
  });
});
