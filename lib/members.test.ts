import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { inviteProblem, inviteSignInUrl, membersScopeNote } from "./members";

describe("members helpers", () => {
  it("returns to the invite page after sign-in, encoded", () => {
    expect(inviteSignInUrl("a/b?c")).toBe("/sign-in?return_to=%2Finvites%2Fa%2Fb%3Fc");
  });
  it("notes read-only for non-owners only", () => {
    expect(membersScopeNote("owner")).toBeNull();
    expect(membersScopeNote("member")).toMatch(/owner/);
    expect(membersScopeNote(undefined)).toMatch(/owner/);
  });
  it("explains dead tokens and a wrong address; leaves other errors alone", () => {
    expect(inviteProblem(new ApiError(410, { code: "invite_invalid" }))).toMatch(/expired/);
    expect(inviteProblem(new ApiError(403, { code: "invite_email_mismatch" }))).toMatch(/different email/);
    expect(inviteProblem(new ApiError(402, { code: "plan_limit" }))).toBeNull();
    expect(inviteProblem(new Error("x"))).toBeNull();
  });
});
