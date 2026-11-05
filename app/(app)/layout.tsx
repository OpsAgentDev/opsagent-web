"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { BillingBanner } from "@/components/billing-banner";
import { ErrorNote } from "@/components/error-note";
import { PasskeyPrompt } from "@/components/passkey-prompt";
import { Welcome } from "@/components/welcome";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { OrgContext, SessionReloadContext, SetupContext } from "@/lib/org";
import { useApi } from "@/lib/use-api";
import "./app.css";

async function loadSession() {
  const [me, orgs] = await Promise.all([unwrap(api.GET("/auth/me")), unwrap(api.GET("/orgs"))]);
  return { me, orgs };
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // The dashboard's setup checklist reports whether it is showing (null: not known yet); it carries its own passkey nudge.
  const [checklistOpen, setChecklistOpen] = useState<boolean | null>(null);
  const { data, error, reload } = useApi(loadSession, []);
  const signedOut = error instanceof ApiError && error.status === 401;
  useEffect(() => {
    if (signedOut) router.replace("/sign-in");
  }, [signedOut, router]);

  if (signedOut || (!data && !error)) return <div className="app"><main className="muted">Loading…</main></div>;
  if (!data) return <div className="app"><main><ErrorNote error={error} /></main></div>;
  // shortcut: first organisation only; add a switcher when a user belongs to several.
  const org = data.orgs[0];
  if (!org) return <div className="app"><Welcome email={data.me.email} onCreated={reload} /></div>;
  // On the dashboard, wait for the checklist's answer so the card does not flash in and out.
  const showPrompt = !data.me.has_passkey && (checklistOpen === false || (checklistOpen === null && pathname !== "/dashboard"));

  return (
    <div className="app">
      <AppNav org={org.name} email={data.me.email} />
      <BillingBanner org={org.slug} />
      {showPrompt && <PasskeyPrompt onAdded={reload} />}
      <SessionReloadContext.Provider value={reload}>
        <SetupContext.Provider value={{ hasPasskey: data.me.has_passkey, reloadSession: reload, setChecklistOpen }}>
          <OrgContext.Provider value={org}>{children}</OrgContext.Provider>
        </SetupContext.Provider>
      </SessionReloadContext.Provider>
    </div>
  );
}
