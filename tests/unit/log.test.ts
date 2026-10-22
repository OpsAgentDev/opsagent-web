import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { log, redact } from "@/lib/log";

beforeEach(() => vi.stubGlobal("window", {}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("redact", () => {
  it("strips sensitive keys case-insensitively, including nested", () => {
    const out = redact({ Token: "a", Cookie: "b", AUTHORIZATION: "c", apiKey: "d", password: "e", keep: 1, n: { apikey: "x", ok: 2 } });
    expect(out).toEqual({ keep: 1, n: { ok: 2 } });
  });

  it("matches keys by substring", () => {
    const out = redact({ access_token: "a", "x-api-key": "b", API_KEY: "c", client_secret: "d", Set_Cookie: "e", ok: 1 });
    expect(out).toEqual({ ok: 1 });
  });

  it("serialises Errors as name and message only", () => {
    const out = redact({ err: new TypeError("boom") }) as { err: Record<string, unknown> };
    expect(out.err).toEqual({ name: "TypeError", message: "boom" });
  });

  it("survives cycles", () => {
    const a: Record<string, unknown> = { x: 1 };
    a.self = a;
    expect(redact(a)).toEqual({ x: 1, self: "[Circular]" });
  });
});

describe("browser log", () => {
  it("is a no-op for debug/info in production but forwards warn/error", () => {
    vi.stubEnv("NODE_ENV", "production");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    log.info("i");
    log.debug("d");
    log.warn("w", { token: "secret", a: 1 });
    expect(info).not.toHaveBeenCalled();
    expect(debug).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("w", { a: 1 });
  });

  it("writes to console outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    log.info("i", { a: 1 });
    expect(info).toHaveBeenCalledWith("i", { a: 1 });
  });
});
