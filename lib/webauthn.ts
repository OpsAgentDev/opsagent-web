// The browser side of brain's passkey ceremonies. Brain sends `{publicKey: …}` options as JSON and takes
// the credential back as JSON; the browser's own JSON helpers are used where they exist, else base64url.
import { api, unwrap } from "@/lib/api/client";

export function toBase64url(bytes: ArrayBuffer | Uint8Array): string {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64url(text: string): ArrayBuffer {
  const s = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes.buffer;
}

export function supported(): boolean {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential === "function" && !!navigator.credentials;
}

/** The user dismissed or timed out the browser's prompt. */
export function cancelled(err: unknown): boolean {
  return err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "AbortError");
}

// Fallback for browsers without parse*FromJSON / toJSON (Safari before 18.4, Firefox before 119).
type Json = Record<string, unknown>;
type Described = { id: string } & Json;
const decodeIds = (list?: Described[]) => list?.map((c) => ({ ...c, id: fromBase64url(c.id) }));

function credentialJson(cred: PublicKeyCredential): unknown {
  if (typeof cred.toJSON === "function") return cred.toJSON();
  const r = cred.response as AuthenticatorAttestationResponse & AuthenticatorAssertionResponse;
  const response: Json = { clientDataJSON: toBase64url(r.clientDataJSON) };
  if (r.attestationObject) response.attestationObject = toBase64url(r.attestationObject);
  if (r.authenticatorData) response.authenticatorData = toBase64url(r.authenticatorData);
  if (r.signature) response.signature = toBase64url(r.signature);
  if (r.userHandle) response.userHandle = toBase64url(r.userHandle);
  return {
    id: cred.id, rawId: toBase64url(cred.rawId), type: cred.type, response,
    clientExtensionResults: cred.getClientExtensionResults(),
  };
}

const publicKeyOf = (options: unknown) => (options as { publicKey: Json }).publicKey;

/** Runs the creation ceremony on brain's register/start options; returns the credential for register/finish. */
export async function createPasskey(options: unknown): Promise<unknown> {
  const pk = publicKeyOf(options);
  const publicKey =
    typeof PublicKeyCredential.parseCreationOptionsFromJSON === "function"
      ? PublicKeyCredential.parseCreationOptionsFromJSON(pk as unknown as PublicKeyCredentialCreationOptionsJSON)
      : ({
          ...pk,
          challenge: fromBase64url(pk.challenge as string),
          user: { ...(pk.user as Json), id: fromBase64url((pk.user as Described).id) },
          excludeCredentials: decodeIds(pk.excludeCredentials as Described[] | undefined),
        } as unknown as PublicKeyCredentialCreationOptions);
  return credentialJson((await navigator.credentials.create({ publicKey })) as PublicKeyCredential);
}

/** Runs the request ceremony on brain's login/start options; returns the credential for login/finish. */
export async function getPasskey(options: unknown): Promise<unknown> {
  const pk = publicKeyOf(options);
  const publicKey =
    typeof PublicKeyCredential.parseRequestOptionsFromJSON === "function"
      ? PublicKeyCredential.parseRequestOptionsFromJSON(pk as unknown as PublicKeyCredentialRequestOptionsJSON)
      : ({
          ...pk,
          challenge: fromBase64url(pk.challenge as string),
          allowCredentials: decodeIds(pk.allowCredentials as Described[] | undefined),
        } as unknown as PublicKeyCredentialRequestOptions);
  return credentialJson((await navigator.credentials.get({ publicKey })) as PublicKeyCredential);
}

// The finish bodies are typed as empty objects in the contract; the credential is opaque JSON here.
type Credential = Record<string, never>;

/** Register start, the browser ceremony, register finish. Shared by the recommendation card and Settings → Security. */
export async function addPasskey(): Promise<void> {
  const options = await unwrap(api.POST("/auth/passkeys/register/start"));
  const credential = (await createPasskey(options)) as Credential;
  await unwrap(api.POST("/auth/passkeys/register/finish", { body: { credential } }));
}

/** Passkey sign-in: login start, the browser ceremony, login finish; returns brain's redirect. */
export async function signInWithPasskey(returnTo?: string): Promise<string> {
  const options = await unwrap(api.POST("/auth/passkeys/login/start", { params: { query: { return_to: returnTo } } }));
  const credential = (await getPasskey(options)) as Credential;
  const { redirect } = await unwrap(api.POST("/auth/passkeys/login/finish", { body: { credential } }));
  return redirect;
}

export const DISMISSED_KEY = "opsagent.passkeyPromptDismissedAt";
const DISMISS_FOR = 30 * 24 * 60 * 60 * 1000;

/** The stored "Not now" time, or null when none is stored or storage is blocked. */
export function readDismissedAt(storage: Pick<Storage, "getItem">): number | null {
  try {
    return Number(storage.getItem(DISMISSED_KEY)) || null;
  } catch {
    return null;
  }
}

/** True while a "Not now" at `at` (epoch ms) still hides the recommendation. */
export function isDismissed(at: number | null, now: number): boolean {
  return at !== null && now - at < DISMISS_FOR;
}
