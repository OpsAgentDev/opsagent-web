import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { emailChangeMessage } from "@/lib/email-change";

const problem = (status: number, code: string) => new ApiError(status, { code, detail: "brain's own words" });

describe("emailChangeMessage", () => {
  it("has a sentence for every code brain returns", () => {
    expect(emailChangeMessage(problem(422, "validation"))).toBe("Enter a valid email address.");
    expect(emailChangeMessage(problem(422, "email_unchanged"))).toBe("That is already your sign-in email.");
    expect(emailChangeMessage(problem(422, "email_not_allowed"))).toMatch(/isn't open to addresses on that domain/);
    expect(emailChangeMessage(problem(403, "fresh_sign_in_required"))).toMatch(/sign out and sign in again/);
    expect(emailChangeMessage(problem(410, "code_invalid"))).toMatch(/That code didn't work/);
    expect(emailChangeMessage(problem(409, "email_taken"))).toMatch(/Nothing was changed/);
  });
  it("reads any 429 as too many attempts", () =>
    expect(emailChangeMessage(problem(429, "whatever"))).toMatch(/Too many attempts/));
  it("falls back for an unknown code or a network failure, never brain's raw text", () => {
    expect(emailChangeMessage(problem(500, "internal"))).toBe("Something went wrong. Try again.");
    expect(emailChangeMessage(new TypeError("fetch failed"))).toBe("Something went wrong. Try again.");
  });
});
