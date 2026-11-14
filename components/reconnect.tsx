"use client";
import { useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";

type Props = { org: string; id: string; provider: string; onVerifying: () => void };
type Link = { quick_create_url?: string | null; stack_name: string };

/** Owner action on a connection that lost access: launch the role again and verify. The connection and its findings stay. */
export function Reconnect({ org, id, provider, onVerifying }: Props) {
  const [link, setLink] = useState<Link | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const path = { params: { path: { org, id } } };

  async function run(step: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await step();
    } catch (err) {
      setError(err as Error);
    }
    setBusy(false);
  }

  const start = () => run(async () => setLink(await unwrap(api.POST("/orgs/{org}/connections/{id}/reconnect", path))));

  function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const role_arn = String(new FormData(e.currentTarget).get("role_arn") ?? "");
    return run(async () => {
      await unwrap(api.POST("/orgs/{org}/connections/{id}/verify", { ...path, body: { role_arn } }));
      onVerifying();
    });
  }

  return (
    <section>
      <h2>Reconnect</h2>
      {!link ? (
        <>
          <p>Give OpsAgent read-only access again. Your findings, history and settings for this account are kept.</p>
          <button type="button" disabled={busy} onClick={start}>Reconnect</button>
        </>
      ) : (
        <form className="stack" onSubmit={verify}>
          {link.quick_create_url && (
            <>
              <ol className="how">
                <li>In AWS CloudFormation, delete the stack <code>{link.stack_name}</code> if it still exists. A new one cannot be created beside it.</li>
                <li>Launch the stack. CloudFormation opens in a new tab with everything filled in; tick the acknowledgement and create it.</li>
                <li>When it finishes, open its Outputs tab, copy the role ARN, paste it below and verify.</li>
              </ol>
              <a className="button" href={link.quick_create_url} target="_blank" rel="noreferrer">
                Launch stack in AWS
              </a>
            </>
          )}
          {provider === "aws" && (
            <label>
              Role ARN
              <input name="role_arn" required placeholder="arn:aws:iam::123456789012:role/OpsAgentReadRole" />
            </label>
          )}
          <button type="submit" disabled={busy}>Verify connection</button>
        </form>
      )}
      <ErrorNote error={error} />
    </section>
  );
}
