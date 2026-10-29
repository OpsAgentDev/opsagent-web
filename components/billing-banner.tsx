"use client";
import Link from "next/link";
import { loadBilling } from "@/lib/billing";
import { useApi } from "@/lib/use-api";

const READ_ONLY = new Set(["none", "paused", "canceled", "trial_ended"]);

/** Billing notices above every app page. Silent when billing isn't set up or can't be read. */
export function BillingBanner({ org }: { org: string }) {
  const { data } = useApi(() => loadBilling(org), [org]);
  if (!data) return null;
  return (
    <>
      {data.status === "past_due" && (
        <p role="status" className="banner warn">
          Your last payment failed. Update your card to keep OpsAgent running.{" "}
          <Link href="/settings/billing">Manage billing</Link>
        </p>
      )}
      {data.enforced && READ_ONLY.has(data.status) && (
        <p role="status" className="banner warn">
          OpsAgent is paused. Start or renew your plan to resume checks. <Link href="/settings/billing">Billing</Link>
        </p>
      )}
      {data.over_limit && (
        <p role="status" className="banner warn">
          You&apos;re over your plan&apos;s member or integration limit. Remove some or change plan.{" "}
          <Link href="/settings/billing">Billing</Link>
        </p>
      )}
    </>
  );
}
