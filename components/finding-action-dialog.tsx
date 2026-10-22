"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type FindingSummary } from "@/lib/api/client";

export type FindingAction = "snooze" | "accept";

const DAY = 86_400_000;
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
// End of the chosen local day, as the RFC 3339 instant brain expects.
const endOfDay = (date: string) => new Date(`${date}T23:59:00`).toISOString();

type Props = { org: string; finding: FindingSummary; action: FindingAction; onClose: (changed: boolean) => void };

export function FindingActionDialog({ org, finding, action, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => ref.current?.showModal(), []);
  const now = Date.now();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const until = String(form.get("until") ?? "");
    const path = { org, id: finding.id };
    try {
      if (action === "snooze") {
        await unwrap(api.POST("/orgs/{org}/findings/{id}/snooze", { params: { path }, body: { until: endOfDay(until) } }));
      } else {
        const body = { reason: String(form.get("reason")), until: until ? endOfDay(until) : null };
        await unwrap(api.POST("/orgs/{org}/findings/{id}/accept", { params: { path }, body }));
      }
      onClose(true);
    } catch (err) {
      setError(err as Error);
    }
  }

  return (
    <dialog ref={ref} onClose={() => onClose(false)}>
      <form className="stack" onSubmit={submit}>
        <strong>{finding.title}</strong>
        {action === "accept" && (
          <label>
            Reason
            <input name="reason" required />
          </label>
        )}
        <label>
          {action === "snooze" ? "Snooze until" : "Accept until (optional, default 90 days)"}
          <input
            name="until"
            type="date"
            required={action === "snooze"}
            min={isoDate(now + DAY)}
            max={isoDate(now + (action === "snooze" ? 29 : 364) * DAY)}
            defaultValue={action === "snooze" ? isoDate(now + 7 * DAY) : undefined}
          />
        </label>
        <div className="row">
          <button type="submit">{action === "snooze" ? "Snooze" : "Accept"}</button>
          <button type="button" onClick={() => ref.current?.close()}>
            Cancel
          </button>
        </div>
        <ErrorNote error={error} />
      </form>
    </dialog>
  );
}
