"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { AiStateNote } from "@/components/ai-state-note";
import { ChatSessions } from "@/components/chat-sessions";
import { ChatThread, type ThreadMessage } from "@/components/chat-thread";
import { ErrorNote } from "@/components/error-note";
import { api, ApiError, streamChat, unwrap } from "@/lib/api/client";
import { AI_LABEL, stateNote } from "@/lib/ai";
import type { ChatEvent } from "@/lib/chat";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

/** Applies one streamed event to the answer being written (the last message). */
function apply(answer: ThreadMessage, e: ChatEvent): ThreadMessage {
  switch (e.type) {
    case "delta":
      return { ...answer, text: answer.text + e.text };
    case "tool":
      return { ...answer, tools: [...(answer.tools ?? []), e.name] };
    case "done":
      return { ...answer, partial: e.partial };
    case "error":
      return answer;
  }
}

function Chat() {
  const org = useOrg();
  const finding = useSearchParams().get("finding");
  const path = { params: { path: { org: org.slug } } };
  const sessions = useApi(() => unwrap(api.GET("/orgs/{org}/chat/sessions", path)), [org.slug]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState(finding ? `About finding:${finding}: ` : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  function reset(id: string | null, list: ThreadMessage[]) {
    setActive(id);
    setMessages(list);
    setError(null);
  }
  const updateLast = (f: (m: ThreadMessage) => ThreadMessage) =>
    setMessages((list) => list.map((m, i) => (i === list.length - 1 ? f(m) : m)));
  async function open(id: string) {
    try {
      const detail = await unwrap(api.GET("/orgs/{org}/chat/sessions/{id}", { params: { path: { org: org.slug, id } } }));
      reset(id, detail.messages);
    } catch (e) {
      setError(e as Error);
    }
  }

  async function send(ev: FormEvent) {
    ev.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    const before = messages;
    setMessages([...before, { role: "user", text, partial: false }, { role: "assistant", text: "", partial: false }]);
    setDraft("");
    abort.current = new AbortController();
    let ended = false;
    try {
      const id = active ?? (await unwrap(api.POST("/orgs/{org}/chat/sessions", { ...path, body: { title: text.slice(0, 60) } }))).id;
      setActive(id);
      await streamChat(
        org.slug,
        id,
        text,
        (e) => {
          if (e.type === "done" || e.type === "error") ended = true;
          if (e.type === "error") setError(new ApiError(200, { code: e.code, detail: `The answer stopped (${e.code}).` }));
          updateLast((m) => apply(m, e));
        },
        abort.current.signal,
      );
      // A stream that closes without `done` was cut off on the way.
      if (!ended) updateLast((m) => ({ ...m, partial: true }));
    } catch (e) {
      // Refused before streaming: brain stored nothing, so the message goes back to the box.
      setMessages(before);
      setDraft(text);
      setError(e as Error);
    } finally {
      setBusy(false);
      sessions.reload();
    }
  }

  const code = error instanceof ApiError ? error.code : undefined;
  return (
    <main>
      <h1>Ask OpsAgent</h1>
      <ErrorNote error={sessions.error} />
      <div className="row" style={{ alignItems: "flex-start" }}>
        <ChatSessions
          sessions={sessions.data?.items ?? []}
          active={active}
          disabled={busy}
          onOpen={open}
          onNew={() => reset(null, [])}
        />
        <section className="stack" style={{ flex: 1 }}>
          <ChatThread messages={messages} />
          {stateNote(code, org.role) ? <AiStateNote code={code} role={org.role} /> : <ErrorNote error={error} />}
          <form className="stack" onSubmit={send}>
            <label>
              Message
              <textarea value={draft} maxLength={4000} onChange={(e) => setDraft(e.target.value)} />
            </label>
            <p className="muted">{AI_LABEL}</p>
            <button type="submit" className="primary fit" disabled={busy || !draft.trim()}>
              {busy ? "Answering…" : "Send"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Chat />
    </Suspense>
  );
}
