"use client";
import Link from "next/link";
import { Fragment } from "react";
import { linkify } from "@/lib/chat";

export type ThreadMessage = { role: string; text: string; partial: boolean; tools?: string[] };

/** Untrusted model text rendered as plain text; only `finding:<uuid>` becomes a link. */
function Linked({ text }: { text: string }) {
  return (
    <p style={{ whiteSpace: "pre-wrap" }}>
      {linkify(text).map((p, i) =>
        "finding" in p ? (
          <Link key={i} href={`/findings/${p.finding}`}>finding:{p.finding}</Link>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </p>
  );
}

/** The conversation: messages oldest first, a "Looking at <tool>…" line per tool call, partial tags. */
export function ChatThread({ messages }: { messages: ThreadMessage[] }) {
  return (
    <div className="stack">
      {messages.map((m, i) => (
        <article key={i} className="stack">
          <strong>{m.role === "user" ? "You" : "OpsAgent"}</strong>
          {m.tools?.map((t, j) => <p key={j} role="status" className="muted">Looking at {t}…</p>)}
          {m.text && <Linked text={m.text} />}
          {m.partial && <p role="status" className="muted">Partial answer</p>}
        </article>
      ))}
    </div>
  );
}
