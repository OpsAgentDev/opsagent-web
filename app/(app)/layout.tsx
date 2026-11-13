"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "@/components/app-nav";
import { BillingBanner } from "@/components/billing-banner";
import { ErrorNote } from "@/components/error-note";
import { Onboarding } from "@/components/onboarding";
import { PasskeyPrompt } from "@/components/passkey-prompt";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { preferredOrg, takePendingInvite } from "@/lib/members";
import { onboardingStep, onboardingSteps } from "@/lib/onboarding";
import { showPasskeyPrompt } from "@/lib/passkey-scope";
import { OrgContext, SessionReloadContext, SetupContext } from "@/lib/org";
import { useApi } from "@/lib/use-api";
import { isDismissed, readDismissedAt, supported } from "@/lib/webauthn";
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
  // Onboarding, this page session: terms were just accepted (the passkey step follows once), and that step was skipped.
  const [afterTerms, setAfterTerms] = useState(false);
  const [passkeySkipped, setPasskeySkipped] = useState(false);
  const { data, error, reload } = useApi(loadSession, []);
  const signedOut = error instanceof ApiError && error.status === 401;
  useEffect(() => {
    if (signedOut) router.replace("/sign-in");
  }, [signedOut, router]);

  // Signed in after opening an invite link: go back to it (brain's return_to cannot carry it).
  useEffect(() => {
    if (!data) return;
    const token = takePendingInvite();
    if (token) router.replace(`/invites/${token}`);
  }, [data, router]);

  if (signedOut || (!data && !error)) return <div className="app"><main className="muted">Loading…</main></div>;
  if (!data) return <div className="app"><main><ErrorNote error={error} /></main></div>;
  // The preferred organisation (set by the switcher or an accepted invite), else the oldest membership.
  const org = data.orgs.find((o) => o.slug === preferredOrg()) ?? data.orgs[0];
  // Client-only: this renders after the client-side session load, so localStorage is there.
  const inputs = {
    termsAccepted: !!data.me.terms_accepted_at,
    afterTerms,
    hasPasskey: data.me.has_passkey,
    passkeySupported: supported(),
    passkeyDismissed: passkeySkipped || isDismissed(readDismissedAt(localStorage), Date.now()),
    hasOrg: !!org,
  };
  const step = onboardingStep(inputs);
  if (step || !org) {
    return (
      <Onboarding
        email={data.me.email}
        step={step ?? "org"}
        steps={onboardingSteps(inputs)}
        onTermsAccepted={() => { setAfterTerms(true); reload(); }}
        onPasskeySkipped={() => setPasskeySkipped(true)}
        onChanged={reload}
      />
    );
  }
  // The card shows on the dashboard (once the checklist has said it is closed) and on Settings → Security only.
  const showPrompt = showPasskeyPrompt({ hasPasskey: data.me.has_passkey, pathname, checklistOpen });

  return (
    <AppShell email={data.me.email} orgs={data.orgs} current={org}>
      <BillingBanner org={org.slug} />
      {showPrompt && <PasskeyPrompt onAdded={reload} />}
      <SessionReloadContext.Provider value={reload}>
        <SetupContext.Provider value={{ hasPasskey: data.me.has_passkey, reloadSession: reload, setChecklistOpen }}>
          <OrgContext.Provider value={org}>{children}</OrgContext.Provider>
        </SetupContext.Provider>
      </SessionReloadContext.Provider>
    </AppShell>
  );
}
