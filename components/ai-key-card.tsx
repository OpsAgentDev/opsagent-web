"use client";
import { useId, useState, type FormEvent } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, ApiError, unwrap, type AiKey, type KeyModel } from "@/lib/api/client";
import { keyLine, OFFICIAL_URLS, STYLES } from "@/lib/ai";
import { useApi } from "@/lib/use-api";

export type Slot = "primary" | "backup";
type Base = { org: string; slot: Slot; onChanged: () => void };

/** Runs one call with busy and error state; the caller's `after` runs on success. */
function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  async function run<T>(call: () => Promise<T>, after: (r: T) => void, failed?: (e: Error) => void) {
    setBusy(true);
    try {
      const r = await call();
      setError(null);
      after(r);
    } catch (e) {
      setError(e as Error);
      failed?.(e as Error);
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}

/** Two pickers from the live list, or two typed ids when the endpoint has no list. */
function ModelFields({ list, routine, chat, setRoutine, setChat }: {
  list?: KeyModel[]; routine: string; chat: string; setRoutine: (v: string) => void; setChat: (v: string) => void;
}) {
  if (list && list.length === 0) {
    return (
      <>
        <label>
          Routine model id
          <input required maxLength={200} value={routine} onChange={(e) => setRoutine(e.target.value)} />
        </label>
        <label>
          Chat model id
          <input required maxLength={200} value={chat} onChange={(e) => setChat(e.target.value)} />
        </label>
      </>
    );
  }
  // The saved model stays listed even when the live list drops it, so each select matches state.
  const withSaved = (ids: string[], saved: string) => (!saved || ids.includes(saved) ? ids : [saved, ...ids]);
  const routineIds = withSaved((list ?? []).map((m) => m.id), routine);
  const chatIds = withSaved((list ?? []).filter((m) => m.tools).map((m) => m.id), chat);
  return (
    <>
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
    </>
  );
}

/** A saved key: its status line, model pickers (PATCH) and remove with confirmation. */
function SavedKey({ org, slot, aiKey, preset, removeText, onChanged }: Base & {
  aiKey: AiKey; preset?: KeyModel[]; removeText: string;
}) {
  const path = { params: { path: { org, slot } } };
  const models = useApi(
    () => (preset?.length ? Promise.resolve(preset) : unwrap(api.GET("/orgs/{org}/ai/keys/{slot}/models", path))),
    [org, slot, aiKey.last4],
  );
  const [routine, setRoutine] = useState(aiKey.models.routine);
  const [chat, setChat] = useState(aiKey.models.chat);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useAction();

  const save = () => {
    setSaved(false);
    run(() => unwrap(api.PATCH("/orgs/{org}/ai/keys/{slot}", { ...path, body: { models: { routine, chat } } })), () => {
      setSaved(true);
      onChanged();
    });
  };
  const remove = () => run(() => unwrap(api.DELETE("/orgs/{org}/ai/keys/{slot}", path)), onChanged);

  return (
    <div className="stack">
      <p>{keyLine(aiKey)}</p>
      <ErrorNote error={models.error ?? error} />
      <ModelFields list={models.data} {...{ routine, chat, setRoutine, setChat }} />
      {saved && <p role="status">Saved.</p>}
      {confirming ? (
        <div className="stack">
          <p>{removeText}</p>
          <div className="row">
            <button type="button" disabled={busy} onClick={remove}>Yes, remove key</button>
            <button type="button" disabled={busy} onClick={() => setConfirming(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="row">
          <button type="button" disabled={busy} onClick={save}>Save models</button>
          <button type="button" disabled={busy} onClick={() => setConfirming(true)}>Remove key</button>
        </div>
      )}
    </div>
  );
}

/** One connection slot: the saved key (when any) and the form that saves or replaces it. */
export function AiKeyCard({ org, slot, title, aiKey, removeText, onChanged }: Base & {
  title: string; aiKey?: AiKey | null; removeText: string;
}) {
  const id = useId();
  const [style, setStyle] = useState("anthropic");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  // Set when brain answers `models_required`: the endpoint has no list, so the ids are typed.
  const [typed, setTyped] = useState(false);
  const [routine, setRoutine] = useState("");
  const [chat, setChat] = useState("");
  const [preset, setPreset] = useState<KeyModel[]>();
  const { busy, error, run } = useAction();

  function saveKey(e: FormEvent) {
    e.preventDefault();
    const body = { style, base_url: baseUrl || null, api_key: apiKey, models: typed ? { routine, chat } : null };
    run(
      () => unwrap(api.PUT("/orgs/{org}/ai/keys/{slot}", { params: { path: { org, slot } }, body })),
      (r) => {
        setPreset(r.models);
        setApiKey("");
        setBaseUrl("");
        setTyped(false);
        setRoutine("");
        setChat("");
        onChanged();
      },
      (err) => err instanceof ApiError && err.code === "models_required" && setTyped(true),
    );
  }
  const changed = () => {
    setPreset(undefined);
    onChanged();
  };

  return (
    <section className="stack" aria-labelledby={id}>
      <h3 id={id}>{title}</h3>
      {aiKey && (
        <SavedKey
          key={`${aiKey.style}-${aiKey.base_host}-${aiKey.last4}`}
          {...{ org, slot, aiKey, preset, removeText }}
          onChanged={changed}
        />
      )}
      <form className="stack" onSubmit={saveKey}>
        <label>
          API style
          <select
            value={style}
            onChange={(e) => {
              setStyle(e.target.value);
              setTyped(false);
            }}
          >
            {Object.entries(STYLES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label>
          Base URL
          <input
            type="url"
            placeholder={OFFICIAL_URLS[style]}
            aria-describedby={`${id}-hint`}
            value={baseUrl}
            onChange={(e) => {
              setBaseUrl(e.target.value);
              setTyped(false);
            }}
          />
        </label>
        <p id={`${id}-hint`} className="muted">Leave empty for Anthropic/OpenAI itself</p>
        <label>
          API key
          <input type="password" autoComplete="off" required value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        </label>
        {typed && <ModelFields list={[]} {...{ routine, chat, setRoutine, setChat }} />}
        <ErrorNote error={error} />
        <button type="submit" className="fit" disabled={busy}>{aiKey ? "Replace key" : "Save key"}</button>
      </form>
    </section>
  );
}
