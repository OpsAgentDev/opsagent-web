"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { CreateOrg } from "@/components/create-org";
import { ErrorNote } from "@/components/error-note";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { OrgContext } from "@/lib/org";
import { useApi } from "@/lib/use-api";

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

  if (signedOut || (!data && !error)) return <main className="muted">Loading…</main>;
  if (!data) return <main><ErrorNote error={error} /></main>;
  // shortcut: first organisation only; add a switcher when a user belongs to several.
  const org = data.orgs[0];

  return (
    <>
      <header className="bar">
        <strong>OpsAgent</strong>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/findings">Findings</Link>
        <Link href="/deliveries">Deliveries</Link>
        <Link href="/settings/delivery">Delivery settings</Link>
        <Link href="/settings/agents">Connected agents</Link>
        <span className="spacer" />
        <span className="muted">
          {org?.name} · {data.me.email}
        </span>
      </header>
      {org ? (
        <OrgContext.Provider value={org}>{children}</OrgContext.Provider>
      ) : (
        <main>
          <CreateOrg onCreated={reload} />
        </main>
      )}
    </>
  );
}
