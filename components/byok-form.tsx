"use client";
import { useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type AiKey } from "@/lib/api/client";
import { PROVIDERS } from "@/lib/ai";
import { useApi } from "@/lib/use-api";

type Props = { org: string; aiKey?: AiKey | null; aiOn: boolean; onChanged: () => void };

/** The saved key: last 4, status, model pickers from its live list, the optional monthly ceiling. */
function SavedKey({ org, aiKey, aiOn, onChanged }: Required<Omit<Props, "aiKey">> & { aiKey: AiKey }) {
  const path = { params: { path: { org } } };
  const models = useApi(() => unwrap(api.GET("/orgs/{org}/ai/key/models", path)), [org, aiKey.last4]);
  const [routine, setRoutine] = useState(aiKey.models.routine);
  const [chat, setChat] = useState(aiKey.models.chat);
  const [ceiling, setCeiling] = useState(aiKey.monthly_credit_ceiling ?? "");
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);

  async function run(call: () => Promise<unknown>, after?: () => void) {
    setBusy(true);
    setSaved(false);
    try {
      await call();
      setError(null);
      after?.();
      onChanged();
    } catch (e) {
      setError(e as Error);
    } finally {
      setBusy(false);
    }
  }
  const body = { models: { routine, chat }, monthly_credit_ceiling: ceiling === "" ? null : Number(ceiling) };
  const save = () => run(() => unwrap(api.PATCH("/orgs/{org}/ai/key", { ...path, body })), () => setSaved(true));
  const remove = () => run(() => unwrap(api.DELETE("/orgs/{org}/ai/key", path)));
  const list = models.data ?? [];
  // The saved model stays listed even when the live list drops it, so each select matches state.
  const withSaved = (ids: string[], saved: string) => (ids.includes(saved) ? ids : [saved, ...ids]);
  const routineIds = withSaved(list.map((m) => m.id), routine);
  const chatIds = withSaved(list.filter((m) => m.tools).map((m) => m.id), chat);

  return (
    <div className="stack">
      <p>
        Your {PROVIDERS[aiKey.provider] ?? aiKey.provider} key ending {aiKey.last4}: {aiKey.status}
      </p>
      <ErrorNote error={models.error ?? error} />
      <label>
        Routine model
        <select value={routine} onChange={(e) => setRoutine(e.target.value)}>
          {routineIds.map((id) => <option key={id}>{id}</option>)}
        </select>
      </label>
      <label>
        Chat model
        <select value={chat} onChange={(e) => setChat(e.target.value)}>
          {chatIds.map((id) => <option key={id}>{id}</option>)}
        </select>
      </label>
      <label>
        Monthly credit ceiling (optional)
        <input type="number" min={0} value={ceiling} onChange={(e) => setCeiling(e.target.value)} />
      </label>
      {saved && <p role="status">Saved.</p>}
      {confirming ? (
        <div className="stack">
          <p>
            Remove this key?{aiOn ? " Dashboard AI stops until you add another key." : ""}
          </p>
          <div className="row">
            <button type="button" disabled={busy} onClick={remove}>Yes, remove key</button>
            <button type="button" disabled={busy} onClick={() => setConfirming(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="row">
          <button type="button" disabled={busy} onClick={save}>Save models and ceiling</button>
          <button type="button" disabled={busy} onClick={() => setConfirming(true)}>Remove key</button>
        </div>
      )}
    </div>
  );
}

/** Bring your own key: owners only (brain enforces it too). A new key replaces the old one. */
export function ByokForm({ org, aiKey, aiOn, onChanged }: Props) {
  const [provider, setProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function saveKey(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await unwrap(api.PUT("/orgs/{org}/ai/key", { params: { path: { org } }, body: { provider, api_key: apiKey } }));
      setApiKey("");
      setError(null);
      onChanged();
    } catch (err) {
      setError(err as Error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack">
      <h2>Your own key</h2>
      {aiKey && <SavedKey key={`${aiKey.provider}-${aiKey.last4}`} org={org} aiKey={aiKey} aiOn={aiOn} onChanged={onChanged} />}
      <form className="stack" onSubmit={saveKey}>
        <label>
          Provider
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            {Object.entries(PROVIDERS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label>
          API key
          <input type="password" autoComplete="off" required value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        </label>
        <ErrorNote error={error} />
        <button type="submit" className="fit" disabled={busy}>{aiKey ? "Replace key" : "Save key"}</button>
      </form>
    </section>
  );
}
