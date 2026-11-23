import { api, unwrap } from "@/lib/api/client";

/** Saves the "Tell me about other Binary Labs products" opt-in; resolves to the stored value. */
export async function saveMarketingOk(value: boolean): Promise<boolean> {
  const me = await unwrap(api.PATCH("/auth/me", { body: { marketing_ok: value } }));
  return me.marketing_ok;
}
