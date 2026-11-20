"use client";
import Link from "next/link";
import { useContext, useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap } from "@/lib/api/client";
import { SessionReloadContext } from "@/lib/org";
import { cleanName } from "@/lib/person-name";

/** The signed-in person's name (editable) and sign-in email (changed by request only). */
export function YourName({ me }: { me: { name?: string | null; email: string } }) {
  const reloadSession = useContext(SessionReloadContext);
  const [name, setName] = useState(me.name ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function save() {
    setSaved(false);
    const clean = cleanName(name);
    if (!clean) return setError(new Error("Enter your name, up to 80 characters."));
    setBusy(true);
    setError(null);
    try {
      const updated = await unwrap(api.PATCH("/auth/me", { body: { name: clean } }));
      setName(updated.name ?? clean);
      setSaved(true);
      reloadSession(); // the account menu shows the name
    } catch (err) {
      setError(err as Error);
    }
    setBusy(false);
  }

  return (
    <section className="card stack">
      <h2>Your details</h2>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <label>
          Your name
          <input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} maxLength={80} autoComplete="name" required />
        </label>
        <div className="row">
          <button type="submit" disabled={busy}>Save</button>
        </div>
        <ErrorNote error={error} showCode={false} />
        {saved && <p role="status" className="ok">Name saved.</p>}
      </form>
      <p>Sign-in email: {me.email}</p>
      <p className="muted">
        To change your sign-in email, write to us through the <Link href="/contact">contact form</Link>.
      </p>
    </section>
  );
}
