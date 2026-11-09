import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { inviteProblem, inviteSignInUrl, membersScopeNote, preferOrg, preferredOrg, rememberInvite, takePendingInvite } from "@/lib/members";

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
    expect(inviteProblem(new ApiError(402, { code: "plan_limit" }))).toMatch(/Ask the owner/);
    expect(inviteProblem(new Error("x"))).toBeNull();
  });
});

describe("remembered choices", () => {
  const mem = new Map<string, string>();
  beforeEach(() => {
    mem.clear();
    vi.stubGlobal("window", { localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) } });
  });
  it("returns a remembered invite once", () => {
    rememberInvite("abcd1234");
    expect(takePendingInvite()).toBe("abcd1234");
    expect(takePendingInvite()).toBeNull();
  });
  it("refuses tokens that are not url-safe, and stale ones", () => {
    rememberInvite("../evil/path");
    expect(takePendingInvite()).toBeNull();
    mem.set("opsagent.pending-invite", JSON.stringify({ token: "abcd1234", at: Date.now() - 2 * 3_600_000 }));
    expect(takePendingInvite()).toBeNull();
  });
  it("remembers the joined organisation", () => {
    preferOrg("team-b");
    expect(preferredOrg()).toBe("team-b");
  });
});
