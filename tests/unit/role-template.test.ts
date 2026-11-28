import { describe, expect, it } from "vitest";
import { newerRoleNote } from "@/lib/connection-status";

const aws = (template_version?: string | null, status = "connected") => ({ provider: "aws", status, template_version });

describe("newerRoleNote", () => {
  it("tells a version 1 connection a newer, narrower role adds the Aurora snapshot check", () => {
    const note = newerRoleNote(aws("1"));
    expect(note).toContain("A newer, narrower read role is available.");
    expect(note).toContain("Aurora cluster snapshots");
    expect(note).toContain("keeps working as it is");
    expect(note).toContain("update the stack in your AWS console with the current template");
  });
  it("tells a version 2 connection that a newer role adds the same checks, without calling it narrower", () => {
    const note = newerRoleNote(aws("2"));
    expect(note).toContain("A newer read role is available.");
    expect(note).toContain("keeps working without them");
    expect(note).not.toContain("narrower");
    expect(note).toContain("Aurora cluster snapshots");
  });
  it("treats an unrecorded version as 1, as brain does", () => {
    expect(newerRoleNote(aws(null))).toContain("narrower");
    expect(newerRoleNote(aws(undefined))).toContain("narrower");
  });
  it("tells a version 3 connection that a newer role adds the trust policy check", () => {
    const note = newerRoleNote(aws("3"));
    expect(note).toContain("A newer read role is available.");
    expect(note).toContain("IAM role trust policies");
    expect(note).toContain("keeps working without it");
    expect(note).not.toContain("narrower");
  });
  it("is silent for the current version, a turned-off connection and other providers", () => {
    expect(newerRoleNote(aws("4"))).toBeNull();
    expect(newerRoleNote(aws("1", "disconnected"))).toBeNull();
    expect(newerRoleNote({ provider: "fake", status: "connected", template_version: "1" })).toBeNull();
  });
  it("is not a warning: it shows for a degraded or connected connection alike", () => {
    expect(newerRoleNote(aws("2", "degraded"))).not.toBeNull();
  });
});
