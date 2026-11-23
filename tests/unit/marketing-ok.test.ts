import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { saveMarketingOk } from "@/lib/marketing-ok";

afterEach(() => vi.restoreAllMocks());

describe("marketing opt-in", () => {
  it("saves the choice through PATCH /auth/me and returns the stored value", async () => {
    const patch = vi
      .spyOn(api, "PATCH")
      .mockResolvedValue({ data: { marketing_ok: true }, response: new Response() } as never);
    expect(await saveMarketingOk(true)).toBe(true);
    expect(patch).toHaveBeenCalledWith("/auth/me", { body: { marketing_ok: true } });
  });
});
