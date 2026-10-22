"use client";
import { useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";

export function CreateOrg({ onCreated }: { onCreated: () => void }) {
  const [error, setError] = useState<Error | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name"));
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      await unwrap(api.POST("/orgs", { body: { name, timezone } }));
      onCreated();
    } catch (err) {
      setError(err as Error);
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      <h1>Create your organisation</h1>
      <label>
        Organisation name
        <input name="name" required />
      </label>
      <button type="submit">Create organisation</button>
      <ErrorNote error={error} />
    </form>
  );
}
