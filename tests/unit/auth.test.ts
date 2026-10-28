import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { authMessage, codeDigits, isProviderUrl, messageFor } from "@/lib/auth-errors";

describe("auth", () => {
  it("maps codes to sentences, unknown to the default", () => {
    expect(messageFor("oauth_state")).toBe("Sign-in took too long or was opened in another tab. Try again.");
    expect(messageFor("google_no_verified_email")).toBe("That account has no verified email address.");
    expect(messageFor("rate_limited")).toBe("Too many attempts. Wait a few minutes and try again.");
    expect(messageFor("<script>")).toBe("Sign-in failed. Try again.");
    expect(messageFor("toString")).toBe("Sign-in failed. Try again.");
  });
  it("reads API failures, any 429 as rate limited", () => {
    expect(authMessage(new ApiError(410, { code: "code_invalid" }))).toBe(messageFor("code_invalid"));
    expect(authMessage(new ApiError(429, {}))).toBe("Too many attempts. Wait a few minutes and try again.");
    expect(authMessage(new TypeError("Failed to fetch"))).toBe("Sign-in failed. Try again.");
  });
  it("keeps only digits, at most six", () => {
    expect(codeDigits("123 456")).toBe("123456");
    expect(codeDigits("123-456")).toBe("123456");
    expect(codeDigits("12a")).toBe("12");
    expect(codeDigits("1234567")).toBe("123456");
  });
  it("only follows Google and GitHub authorize URLs", () => {
    expect(isProviderUrl("https://accounts.google.com/o/oauth2/v2/auth?x=1")).toBe(true);
    expect(isProviderUrl("https://github.com/login/oauth/authorize?x=1")).toBe(true);
    expect(isProviderUrl("https://github.com.evil.test/")).toBe(false);
    expect(isProviderUrl("http://github.com/")).toBe(false);
    expect(isProviderUrl("javascript:alert(1)")).toBe(false);
    expect(isProviderUrl("/dashboard")).toBe(false);
  });
});
