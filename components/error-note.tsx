import { ApiError } from "@/lib/api/client";

// Sentences for brain's billing refusals (402 on writes); other errors show brain's own text.
const BILLING_MESSAGES = new Map<string, string>([
  ["billing_required", "OpsAgent is read-only until you start or renew your plan. Open Billing to continue."],
  ["trial_limit", "Your free trial covers one cloud account. Change plan to add more."],
  ["plan_limit", "You're at your plan's member or integration limit. Remove some or change plan."],
]);

export function ErrorNote({ error }: { error?: Error | null }) {
  if (!error) return null;
  const code = error instanceof ApiError ? error.code : undefined;
  const billing = code ? BILLING_MESSAGES.get(code) : undefined;
  return (
    <p role="alert" className="error">
      {billing ?? error.message}
      {code && !billing ? ` (${code})` : ""}
    </p>
  );
}
