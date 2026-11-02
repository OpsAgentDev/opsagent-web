"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { CONFIRM, price } from "@/components/human-review";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { useApi } from "@/lib/use-api";

type DialogProps = { org: string; findingId: string; description: string; onClose: () => void };

function ReviewDialog({ org, findingId, description, onClose }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<Error | null>(null);
  const [limited, setLimited] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => ref.current?.showModal(), []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const note = String(new FormData(e.currentTarget).get("note") ?? "").trim();
    setError(null);
    setLimited(false);
    try {
      const body = { kind: "finding", finding_id: findingId, note: note || null };
      await unwrap(api.POST("/orgs/{org}/human-reviews", { params: { path: { org } }, body }));
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setLimited(true);
      else setError(err as Error);
    }
  }

  return (
    <dialog ref={ref} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <p>{description}</p>
        <p className="muted">{CONFIRM}</p>
        {sent ? (
          <p role="status">Request sent.</p>
        ) : (
          <label>
            Note
            <textarea name="note" rows={4} maxLength={2000} />
          </label>
        )}
        <div className="row">
          {!sent && <button type="submit">Submit</button>}
          <button type="button" onClick={() => ref.current?.close()}>{sent ? "Close" : "Cancel"}</button>
        </div>
        <ErrorNote error={error} />
        {limited && <p role="alert" className="error">You&apos;ve sent 5 requests today. Try again tomorrow.</p>}
      </form>
    </dialog>
  );
}

export function FindingReviewButton({ org, findingId, role }: { org: string; findingId: string; role: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useApi(() => unwrap(api.GET("/orgs/{org}/human-reviews", { params: { path: { org } } })), [org]);
  const offer = data?.offers.find((o) => o.kind === "finding");
  const owner = role === "owner";
  return (
    <div className="stack">
      <button type="button" className="fit" disabled={!owner} onClick={() => setOpen(true)}>
        Get a human review{offer ? ` · ${price(offer.price_cents)}` : ""}
      </button>
      {!owner && <p className="muted">Only owners can request a review</p>}
      {open && offer && (
        <ReviewDialog org={org} findingId={findingId} description={offer.description} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
