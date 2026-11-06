import Link from "next/link";
import { Status } from "@/components/badges";
import type { Connection } from "@/lib/api/client";
import { accountText, connectionSentence, scheduleText } from "@/lib/connection-status";

/** Name, status chip and one sentence about what the status means. */
export function ConnectionHeader({ c }: { c: Connection }) {
  return (
    <header className="conn-title">
      <h1>{c.display_name ?? c.id}</h1>
      <span data-testid="connection-status"><Status value={c.status} /></span>
      <p className="conn-sentence">{connectionSentence(c.status, c.status_reason) ?? c.status_reason}</p>
    </header>
  );
}

/** Readable facts: the account and the schedules. */
export function ConnectionFacts({ c }: { c: Connection }) {
  return (
    <dl className="facts">
      <dt>Account</dt>
      <dd>{accountText(c.external_account_id)}</dd>
      <dt>Nightly scan</dt>
      <dd>{scheduleText(c.scan_time_local)}</dd>
      <dt>Briefing</dt>
      <dd>{scheduleText(c.briefing_time_local)}</dd>
    </dl>
  );
}

/** Next actions: scan now (when the account can be read), preview the briefing, go to the findings. */
export function ConnectionActions({ c, canScan, onScan, started }: { c: Connection; canScan: boolean; onScan: () => void; started: boolean }) {
  return (
    <div className="row">
      <button type="button" onClick={onScan} disabled={!canScan}>Scan now</button>
      {started && <span>Scan started. Findings appear as checks finish.</span>}
      <Link href={`/connections/${c.id}/briefing`}>Preview briefing</Link>
      <Link href="/findings">View findings</Link>
    </div>
  );
}
