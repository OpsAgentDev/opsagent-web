import { afterEach, expect, it, vi } from "vitest";
import { log } from "@/lib/log";

afterEach(() => vi.restoreAllMocks());

it("server writes one JSON line with level, msg, ts and redacted fields", () => {
  const out = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  log.info("hello", { a: 1, password: "p" });
  const line = JSON.parse(String(out.mock.calls[0]![0]));
  expect(line).toMatchObject({ level: "info", msg: "hello", a: 1 });
  expect(line.password).toBeUndefined();
  expect(typeof line.ts).toBe("string");
});
