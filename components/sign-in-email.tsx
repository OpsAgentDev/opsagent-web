"use client";
import { useContext, useState } from "react";
import { CodeInput } from "@/components/auth/code-input";
import { api, unwrap } from "@/lib/api/client";
import { emailChangeMessage } from "@/lib/email-change";
import { SessionReloadContext } from "@/lib/org";

/** The sign-in email with "Change": the new address, then the 6-digit code brain mails to it. */
export function SignInEmail({ email, onChanged }: { email: string; onChanged: () => void }) {
  const reloadSession = useContext(SessionReloadContext);
  const [step, setStep] = useState<"shown" | "address" | "code">("shown");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [codeKey, setCodeKey] = useState(0); // remounts (clears and refocuses) the code input

  function show(next: "shown" | "address") {
    setStep(next);
    setAddress("");
    setError(null);
    setNote(null);
  }

  async function send(sent: string | null) {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      await unwrap(api.POST("/auth/me/email", { body: { email: address.trim() } }));
      setStep("code");
      setCodeKey((n) => n + 1);
      setNote(sent);
    } catch (err) {
      setError(emailChangeMessage(err));
    }
    setBusy(false);
  }

  async function confirm(code: string) {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      await unwrap(api.POST("/auth/me/email/confirm", { body: { code } }));
      show("shown");
      setNote("Sign-in email changed. Your other devices were signed out.");
      reloadSession(); // the account menu shows the address
      onChanged();
    } catch (err) {
      setError(emailChangeMessage(err));
      setCodeKey((n) => n + 1); // a wrong code clears the input and focuses it again
    }
    setBusy(false);
  }

  const alert = error ? <p role="alert" className="error">{error}</p> : null;
  const status = note ? <p role="status" className="ok">{note}</p> : null;

  if (step === "address") {
    return (
      <form className="stack" onSubmit={(e) => { e.preventDefault(); void send(null); }}>
        <p>Sign-in email: {email}</p>
        <label>
          New sign-in email
          <input type="email" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="email" placeholder="you@company.com" required autoFocus />
        </label>
        <div className="row">
          <button type="submit" disabled={busy}>Send code</button>
          <button type="button" onClick={() => show("shown")}>Cancel</button>
        </div>
        {alert}
      </form>
    );
  }

  if (step === "code") {
    return (
      <div className="stack">
        <p>Sign-in email: {email}</p>
        <p>
          We sent a code to <strong>{address.trim()}</strong>. It works once and expires in 15 minutes. If nothing arrives, check the address and try again.
        </p>
        <CodeInput key={codeKey} onComplete={confirm} disabled={busy} />
        {alert}
        {status}
        <div className="row">
          <button type="button" disabled={busy} onClick={() => send("We sent a new code.")}>Send a new code</button>
          <button type="button" onClick={() => show("shown")}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="row">
        <p>Sign-in email: {email}</p>
        <button type="button" onClick={() => show("address")}>Change</button>
      </div>
      {status}
    </div>
  );
}
