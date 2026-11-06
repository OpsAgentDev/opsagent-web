"use client";
import { useEffect, useRef, useState } from "react";
import { log } from "@/lib/log";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile";

type Api = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window { turnstile?: Api }
}

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<Api> | null = null;

function load(): Promise<Api> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<Api>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
    s.onerror = () => reject(new Error("turnstile script failed"));
    document.head.appendChild(s);
  }).catch((err) => { loading = null; throw err; });
  return loading;
}

/** Cloudflare Turnstile. Renders nothing without a site key. Bump `resetKey` after each submit: a token is single use. */
export function Turnstile({ onToken, resetKey = 0 }: { onToken: (token: string | null) => void; resetKey?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<{ api: Api; id: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const report = useRef(onToken);
  useEffect(() => { report.current = onToken; });

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !box.current) return;
    let gone = false;
    const fail = () => { setFailed(true); report.current(null); };
    load().then((api) => {
      if (gone || !box.current) return;
      const id = api.render(box.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "dark",
        size: "flexible",
        callback: (t: string) => { setFailed(false); report.current(t); },
        "expired-callback": () => report.current(null),
        "error-callback": fail,
      });
      widget.current = { api, id };
    }, (err) => { log.warn("turnstile load failed", { message: String(err) }); fail(); });
    return () => {
      gone = true;
      widget.current?.api.remove(widget.current.id);
      widget.current = null;
    };
  }, []);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    widget.current?.api.reset(widget.current.id);
    report.current(null);
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) return null;
  return (
    <>
      <div ref={box} className="turnstile" />
      {failed ? <p role="alert" className="error">We couldn&apos;t load the security check. Reload and try again.</p> : null}
    </>
  );
}
