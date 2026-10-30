"use client";
import { useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type AiKey } from "@/lib/api/client";
import { useApi } from "@/lib/use-api";

const PROVIDERS: Record<string, string> = { anthropic: "Anthropic", openai: "OpenAI" };
type Props = { org: string; aiKey?: AiKey | null; onChanged: () => void };

/** The saved key: last 4, status, model pickers from its live list, the optional monthly ceiling. */
function SavedKey({ org, aiKey, onChanged }: { org: string; aiKey: AiKey; onChanged: () => void }) {
  const path = { params: { path: { org } } };
  const models = useApi(() => unwrap(api.GET("/orgs/{org}/ai/key/models", path)), [org, aiKey.last4]);
  const [routine, setRoutine] = useState(aiKey.models.routine);
  const [chat, setChat] = useState(aiKey.models.chat);
  const [ceiling, setCeiling] = useState(aiKey.monthly_credit_ceiling ?? "");
  const [error, setError] = useState<Error | null>(null);

  async function run(call: () => Promise<unknown>) {
    try {
      await call();
      setError(null);
      onChanged();
    } catch (e) {
      setError(e as Error);
    }
  }
  const body = { models: { routine, chat }, monthly_credit_ceiling: ceiling === "" ? null : Number(ceiling) };
  const save = () => run(() => unwrap(api.PATCH("/orgs/{org}/ai/key", { ...path, body })));
  const remove = () => run(() => unwrap(api.DELETE("/orgs/{org}/ai/key", path)));
  const list = models.data ?? [];

  return (
    <div className="stack">
      <p>
        Your {PROVIDERS[aiKey.provider] ?? aiKey.provider} key ending {aiKey.last4}: {aiKey.status}
      </p>
      <ErrorNote error={models.error ?? error} />
      <label>
        Routine model
        <select value={routine} onChange={(e) => setRoutine(e.target.value)}>
          {list.length === 0 && <option>{routine}</option>}
          {list.map((m) => <option key={m.id}>{m.id}</option>)}
        </select>
      </label>
      <label>
        Chat model
        <select value={chat} onChange={(e) => setChat(e.target.value)}>
          {list.length === 0 && <option>{chat}</option>}
          {list.filter((m) => m.tools).map((m) => <option key={m.id}>{m.id}</option>)}
        </select>
      </label>
      <label>
        Monthly credit ceiling (optional)
        <input type="number" min={0} value={ceiling} onChange={(e) => setCeiling(e.target.value)} />
      </label>
      <div className="row">
        <button type="button" onClick={save}>Save models and ceiling</button>
        <button type="button" onClick={remove}>Remove key</button>
      </div>
    </div>
  );
}

/** Bring your own key: owners only (brain enforces it too). A new key replaces the old one. */
export function ByokForm({ org, aiKey, onChanged }: Props) {
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
      {aiKey && <SavedKey key={`${aiKey.provider}-${aiKey.last4}`} org={org} aiKey={aiKey} onChanged={onChanged} />}
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
