import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFirstTouch, recordFirstTouch } from "@/lib/source";

// A minimal cookie jar: writes keep name=value, reads return them joined.
let jar: Record<string, string>;
let store: Record<string, string>;
beforeEach(() => {
  jar = {};
  store = { "analytics-consent": "granted" };
  (globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => store[k] ?? null };
  (globalThis as { document?: unknown }).document = {
    get cookie() { return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; "); },
    set cookie(s: string) { const [kv = ""] = s.split(";"); const i = kv.indexOf("="); jar[kv.slice(0, i)] = kv.slice(i + 1); },
  };
});
afterEach(() => { delete (globalThis as { document?: unknown }).document; delete (globalThis as { localStorage?: unknown }).localStorage; });

describe("first touch", () => {
  it("reads_null_when_absent", () => {
    expect(readFirstTouch()).toBeNull();
  });
  it("no_cookie_without_consent", () => {
    for (const v of [undefined, "denied"]) {
      store = v ? { "analytics-consent": v } : {};
      recordFirstTouch(new URL("https://opsagent.dev/?utm_source=hn"), "https://news.ycombinator.com/");
      expect(jar).toEqual({});
    }
    // A cookie left from before a withdrawal is not sent either.
    store = { "analytics-consent": "granted" };
    recordFirstTouch(new URL("https://opsagent.dev/?utm_source=hn"), "");
    store = { "analytics-consent": "denied" };
    expect(readFirstTouch()).toBeNull();
  });
  it("keeps_first_touch", () => {
    recordFirstTouch(new URL("https://opsagent.dev/pricing?utm_source=hn"), "https://news.ycombinator.com/item?id=1");
    recordFirstTouch(new URL("https://opsagent.dev/?utm_source=x"), "https://x.com/");
    expect(readFirstTouch()).toEqual({
      utm_source: "hn", utm_medium: null, utm_campaign: null,
      referrer: "https://news.ycombinator.com/item", landing_path: "/pricing",
    });
  });
  it("ignores_same_site_referrer", () => {
    recordFirstTouch(new URL("https://opsagent.dev/pricing"), "https://opsagent.dev/features");
    expect(readFirstTouch()?.referrer).toBeNull();
  });
  it("clips long values and survives a bad cookie", () => {
    recordFirstTouch(new URL(`https://opsagent.dev/?utm_campaign=${"a".repeat(500)}`), "");
    expect(readFirstTouch()?.utm_campaign).toHaveLength(200);
    jar["oa_src"] = "%7Bnot-json";
    expect(readFirstTouch()).toBeNull();
  });
});
