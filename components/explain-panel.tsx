"use client";
import Link from "next/link";
import { useState } from "react";
import { AiStateNote } from "@/components/ai-state-note";
import { ErrorNote } from "@/components/error-note";
import { api, ApiError, unwrap, type Explanation } from "@/lib/api/client";
import { AI_LABEL, stateNote } from "@/lib/ai";

type Props = { org: string; id: string; role: string; cached: Explanation | null };

/** The finding's AI explanation: cached text with its label and report link, or a generate button. */
export function ExplainPanel({ org, id, role, cached }: Props) {
  const [explanation, setExplanation] = useState(cached);
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [note, setNote] = useState("");
  const [reported, setReported] = useState(false);
  const path = { params: { path: { org, id } } };

  async function act(call: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await call();
    } catch (e) {
      setError(e as Error);
    } finally {
      setBusy(false);
    }
  }
  const explain = () => act(async () => setExplanation(await unwrap(api.POST("/orgs/{org}/findings/{id}/explanation", path))));
  const report = () =>
    act(async () => {
      await unwrap(api.POST("/orgs/{org}/findings/{id}/report-explanation", { ...path, body: { note } }));
      setReported(true);
    });

  const code = error instanceof ApiError ? error.code : undefined;
  return (
    <section className="stack">
      <h2>Explanation</h2>
      {stateNote(code, role) ? <AiStateNote code={code} role={role} /> : <ErrorNote error={error} />}
      {explanation ? (
        <>
          <p className="muted">{AI_LABEL}</p>
          <p style={{ whiteSpace: "pre-wrap" }}>{explanation.text}</p>
          {reported ? (
            <p role="status">Thanks. We&apos;ll look at it.</p>
          ) : reporting ? (
            <>
              <label>
                What is wrong?
                <textarea value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
              </label>
              <button type="button" className="fit" disabled={busy || !note.trim()} onClick={report}>Send report</button>
            </>
          ) : (
            <button type="button" className="fit" onClick={() => setReporting(true)}>Report a wrong explanation</button>
          )}
        </>
      ) : (
        <button type="button" className="primary fit" disabled={busy} onClick={explain}>
          {busy ? "Explaining…" : "Explain this finding"}
        </button>
      )}
      <Link href={`/chat?finding=${id}`}>Ask about this finding</Link>
    </section>
  );
}
