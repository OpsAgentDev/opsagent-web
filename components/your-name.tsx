"use client";
import { useContext, useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { SignInEmail } from "@/components/sign-in-email";
import { api, unwrap } from "@/lib/api/client";
import { SessionReloadContext } from "@/lib/org";
import { cleanName } from "@/lib/person-name";

/** The signed-in person's name and sign-in email, both editable. */
export function YourName({ me, onEmailChanged }: { me: { name?: string | null; email: string }; onEmailChanged: () => void }) {
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
      <SignInEmail email={me.email} onChanged={onEmailChanged} />
    </section>
  );
}
