"use client";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_KEY, CONSENT_OPEN_EVENT, consentOf, GA_ID, gaCookies, type Consent } from "@/lib/analytics";

/** Google Analytics on the public pages: a banner asks first, and the script loads only after "Accept". */
export function Analytics() {
  // The server cannot know the stored answer; "unknown" renders nothing until the page is live.
  const [consent, setConsent] = useState<Consent | null | "unknown">("unknown");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!GA_ID) return;
    let stored: string | null = null;
    try { stored = localStorage.getItem(CONSENT_KEY); } catch { /* storage blocked: ask each visit */ }
    setConsent(consentOf(stored));
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);
  if (!GA_ID || consent === "unknown") return null;

  const answer = (choice: Consent) => {
    try { localStorage.setItem(CONSENT_KEY, choice); } catch { /* not remembered */ }
    if (choice === "denied" && consent === "granted") {
      // Withdrawn: drop Google's cookies and reload so its script is gone from the page.
      for (const name of gaCookies(document.cookie)) {
        document.cookie = `${name}=; Max-Age=0; path=/; domain=.${location.hostname.replace(/^www\./, "")}`;
        document.cookie = `${name}=; Max-Age=0; path=/`;
      }
      location.reload();
      return;
    }
    setConsent(choice);
    setOpen(false);
  };

  return (
    <>
      {consent === "granted" ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(GA_ID)});`}
          </Script>
        </>
      ) : null}
      {consent === null || open ? (
        <section className="cookie-banner" aria-label="Cookies">
          <p>
            We would like to use Google Analytics cookies to see which pages are useful. Nothing is set unless you
            accept. <Link href="/privacy">Privacy</Link>
          </p>
          <div>
            <button type="button" onClick={() => answer("denied")}>Decline</button>
            <button type="button" className="primary" onClick={() => answer("granted")}>Accept</button>
          </div>
        </section>
      ) : null}
    </>
  );
}

/** Footer control to change the answer later; shown only when analytics is built in. */
export function CookieSettings() {
  if (!GA_ID) return null;
  return (
    <button type="button" className="cookie-settings" onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}>
      Cookie settings
    </button>
  );
}
