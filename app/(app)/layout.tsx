"use client";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { BillingBanner } from "@/components/billing-banner";
import { CreateOrg } from "@/components/create-org";
import { ErrorNote } from "@/components/error-note";
import { PasskeyPrompt } from "@/components/passkey-prompt";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { OrgContext, SessionReloadContext } from "@/lib/org";
import { useApi } from "@/lib/use-api";
import "./app.css";

async function loadSession() {
  const [me, orgs] = await Promise.all([unwrap(api.GET("/auth/me")), unwrap(api.GET("/orgs"))]);
  return { me, orgs };
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, error, reload } = useApi(loadSession, []);
  const signedOut = error instanceof ApiError && error.status === 401;
  useEffect(() => {
    if (signedOut) router.replace("/sign-in");
  }, [signedOut, router]);

  if (signedOut || (!data && !error)) return <div className="app"><main className="muted">Loading…</main></div>;
  if (!data) return <div className="app"><main><ErrorNote error={error} /></main></div>;
  // shortcut: first organisation only; add a switcher when a user belongs to several.
  const org = data.orgs[0];

  return (
    <div className="app">
      <AppNav org={org?.name} email={data.me.email} />
      {org && <BillingBanner org={org.slug} />}
      {data.me.has_passkey ? null : <PasskeyPrompt onAdded={reload} />}
      <SessionReloadContext.Provider value={reload}>
        {org ? (
          <OrgContext.Provider value={org}>{children}</OrgContext.Provider>
        ) : (
          <main>
            <CreateOrg onCreated={reload} />
          </main>
        )}
      </SessionReloadContext.Provider>
    </div>
  );
}
