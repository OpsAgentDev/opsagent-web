"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type CreatedConnection } from "@/lib/api/client";
import { loadBilling } from "@/lib/billing";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

const FAKE_ENABLED = process.env.NEXT_PUBLIC_OPSAGENT_FAKE === "1";

type Created = CreatedConnection & { provider: string };

export default function ConnectAws() {
  const org = useOrg();
  const router = useRouter();
  const [created, setCreated] = useState<Created | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  // Enforced and no plan yet: brain would refuse the connection (402), so start at Billing.
  const { data: billing } = useApi(() => loadBilling(org.slug).catch(() => null), [org.slug]);
  const owner = org.role === "owner";
  const needsPlan = billing?.enforced && billing.status === "none";
  useEffect(() => {
    if (needsPlan) router.replace("/settings/billing");
  }, [needsPlan, router]);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const provider = String(form.get("provider") ?? "aws");
    const display_name = String(form.get("display_name"));
    try {
      const c = await unwrap(
        api.POST("/orgs/{org}/connections", { params: { path: { org: org.slug } }, body: { provider, display_name } }),
      );
      setCreated({ ...c, provider });
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
    setBusy(false);
  }

  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!created || busy) return;
    setBusy(true);
    const role_arn = String(new FormData(e.currentTarget).get("role_arn") ?? "");
    try {
      await unwrap(
        api.POST("/orgs/{org}/connections/{id}/verify", {
          params: { path: { org: org.slug, id: created.id } },
          body: { role_arn },
        }),
      );
      // The connection page polls status until verification settles.
      router.push(`/connections/${created.id}`); // stays busy while navigating
    } catch (err) {
      setError(err as Error);
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>Connect an AWS account</h1>
      <p className="muted step-note">Step {created ? 2 : 1} of 2</p>
      {!owner ? (
        <p>Ask an owner to connect a cloud account.</p>
      ) : !created ? (
        <form className="stack" onSubmit={create}>
          <p>Name this account so you can tell it apart later, for example production. Next you create a read-only role in AWS; OpsAgent never gets keys to your account.</p>
          {FAKE_ENABLED && (
            <fieldset className="row">
              <legend>Provider</legend>
              <label className="row">
                <input type="radio" name="provider" value="aws" defaultChecked /> AWS
              </label>
              <label className="row">
                <input type="radio" name="provider" value="fake" /> Fake (local fixtures)
              </label>
            </fieldset>
          )}
          <label>
            Display name
            <input name="display_name" required placeholder="production" />
          </label>
          <button type="submit" disabled={busy}>Create connection</button>
        </form>
      ) : (
        <form className="stack" onSubmit={verify}>
          {created.quick_create_url && (
            <>
              <ol className="how">
                <li>Launch the stack. CloudFormation opens in a new tab with everything filled in; tick the acknowledgement and create it.</li>
                <li>When it finishes, open its Outputs tab and copy the role ARN.</li>
                <li>Paste the ARN below and verify.</li>
              </ol>
              <a className="button" href={created.quick_create_url} target="_blank" rel="noreferrer">
                Launch stack in AWS
              </a>
            </>
          )}
          {created.provider === "aws" && (
            <label>
              Role ARN
              <input name="role_arn" required placeholder="arn:aws:iam::123456789012:role/OpsAgentRead" />
            </label>
          )}
          <button type="submit" disabled={busy}>Verify connection</button>
        </form>
      )}
      <ErrorNote error={error} />
    </main>
  );
}
