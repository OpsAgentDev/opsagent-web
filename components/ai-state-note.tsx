"use client";
import Link from "next/link";
import { stateNote } from "@/lib/ai";

/** The note and next action for one of the four Dashboard AI refusal states; nothing otherwise. */
export function AiStateNote({ code, role, detail }: { code?: string; role: string; detail?: string }) {
  const note = stateNote(code, role, detail);
  if (!note) return null;
  return (
    <p role="status" className="muted">
      {note.href ? <Link href={note.href}>{note.text}</Link> : note.text}
    </p>
  );
}
