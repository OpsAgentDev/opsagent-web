// The one place web talks to brain: a typed client over the generated schema, cookies included,
// CSRF header on every mutating request, problem details surfaced as ApiError.
import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "./schema";

type Schemas = components["schemas"];
export type Me = Schemas["Me"];
export type Org = Schemas["Org"];
export type Connection = Schemas["Connection"];
export type CreatedConnection = Schemas["CreatedConnection"];
export type FindingSummary = Schemas["FindingSummary"];
export type FindingPage = Schemas["Page_FindingSummary"];
export type Run = Schemas["Run"];
export type Problem = Schemas["Problem"];
export type Recipient = Schemas["Recipient"];
export type Member = Schemas["Member"];
export type Channel = Schemas["Channel"];
export type Billing = Schemas["BillingOut"];
export type FindingDetail = Schemas["FindingDetail"];
export type Explanation = Schemas["ExplanationOut"];
export type AiStatus = Schemas["AiStatusOut"];
export type AiKey = Schemas["AiKeyOut"];
export type KeyModel = Schemas["KeyModelOut"];

/** A production build without an explicit brain URL would ship pointing at localhost. */
export function resolveApiBaseUrl(configured: string | undefined, nodeEnv: string | undefined): string {
  if (configured) return configured;
  if (nodeEnv === "production") throw new Error("NEXT_PUBLIC_API_BASE_URL must be set for production builds");
  return "http://localhost:3000";
}

export const API_BASE_URL = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL, process.env.NODE_ENV);

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: Partial<Problem>,
  ) {
    super(problem.detail ?? problem.title ?? `Request failed (${status})`);
  }

  get code(): string | undefined {
    return this.problem.code;
  }
}

export const api = createClient<paths>({ baseUrl: `${API_BASE_URL}/v1`, credentials: "include" });

/** Resolves to the response body, or throws ApiError with the problem details. */
export async function unwrap<R extends { data?: unknown; error?: unknown; response: Response }>(
  call: Promise<R>,
): Promise<Exclude<R["data"], undefined>> {
  const { data, error, response } = await call;
  if (!response.ok) throw new ApiError(response.status, (error ?? {}) as Partial<Problem>);
  return data as Exclude<R["data"], undefined>;
}

// Requests made without a session (brain checks CSRF only on signed-in sessions): brain checks their
// Origin, their OAuth state, or (confirm, unsubscribe) their single-use token instead.
const ANONYMOUS = new Set([
  "/auth/magic-link", "/auth/magic-link/redeem", "/auth/magic-link/verify",
  "/auth/sign-in/github/start", "/auth/sign-in/google/start",
  "/auth/passkeys/login/start", "/auth/passkeys/login/finish",
  "/recipients/confirm", "/unsubscribe/{token}",
]);
// Bound to the session id; sign-in ends in a full page load, which drops this cache.
let csrf: Promise<string> | undefined;

function csrfToken(): Promise<string> {
  csrf ??= unwrap(api.GET("/auth/csrf")).then(
    (r) => r.token,
    (e: unknown) => {
      csrf = undefined;
      throw e;
    },
  );
  return csrf;
}

const withCsrf: Middleware = {
  async onRequest({ request, schemaPath }) {
    if (request.method === "GET" || ANONYMOUS.has(schemaPath)) return request;
    request.headers.set("X-CSRF-Token", await csrfToken());
    return request;
  },
};
// A stale token (e.g. the session changed) is dropped so the next call refetches; no automatic retry.
const dropStaleCsrf: Middleware = {
  async onResponse({ response }) {
    if (response.status !== 403) return;
    const problem = (await response.clone().json().catch(() => ({}))) as Partial<Problem>;
    if (problem.code === "csrf") csrf = undefined;
  },
};
api.use(withCsrf, dropStaleCsrf);
