"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";
import { useOrg } from "@/lib/org";

const FAKE_ENABLED = process.env.NEXT_PUBLIC_OPSAGENT_FAKE === "1";

type Created = { id: string; provider: string; quickCreateUrl: string | null };

export default function ConnectAws() {
  const org = useOrg();
  const router = useRouter();
  const [created, setCreated] = useState<Created | null>(null);
  const [error, setError] = useState<Error | null>(null);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const provider = String(form.get("provider") ?? "aws");
    const display_name = String(form.get("display_name"));
    try {
      const c = await unwrap(
        api.POST("/orgs/{org}/connections", { params: { path: { org: org.slug } }, body: { provider, display_name } }),
      );
      setCreated({ id: c.id, provider, quickCreateUrl: c.quick_create_url ?? null });
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }

  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!created) return;
    const role_arn = String(new FormData(e.currentTarget).get("role_arn") ?? "");
    try {
      await unwrap(
        api.POST("/orgs/{org}/connections/{id}/verify", {
          params: { path: { org: org.slug, id: created.id } },
          body: { role_arn },
        }),
      );
      // The connection page polls status until verification settles.
      router.push(`/connections/${created.id}`);
    } catch (err) {
      setError(err as Error);
    }
  }

  return (
    <main>
      <h1>Connect an AWS account</h1>
      {!created ? (
        <form className="stack" onSubmit={create}>
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
          <button type="submit">Create connection</button>
        </form>
      ) : (
        <form className="stack" onSubmit={verify}>
          {created.quickCreateUrl && (
            <>
              <p>
                1. Create the read-only role in your account (CloudFormation opens in a new tab), then copy the
                role ARN from the stack outputs.
              </p>
              <a className="button" href={created.quickCreateUrl} target="_blank" rel="noreferrer">
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
          <button type="submit">Verify connection</button>
        </form>
      )}
      <ErrorNote error={error} />
    </main>
  );
}
