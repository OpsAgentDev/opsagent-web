"use client";
import type { ChatSession } from "@/lib/api/client";

type Props = {
  sessions: ChatSession[];
  active: string | null;
  disabled: boolean;
  onOpen: (id: string) => void;
  onNew: () => void;
};

/** The member's own chat sessions, newest first (brain's order), and "New chat". */
export function ChatSessions({ sessions, active, disabled, onOpen, onNew }: Props) {
  return (
    <nav className="stack" aria-label="Chats">
      <button type="button" className="fit" disabled={disabled} onClick={onNew}>New chat</button>
      {sessions.map((s) => (
        <button
          key={s.id}
          type="button"
          className="fit"
          disabled={disabled}
          aria-current={s.id === active ? "true" : undefined}
          onClick={() => onOpen(s.id)}
        >
          {s.title}
        </button>
      ))}
    </nav>
  );
}
