// The one place web talks to brain: a typed client over the generated schema, cookies included,
// CSRF header on every mutating request, problem details surfaced as ApiError.
import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "./schema";

type Schemas = components["schemas"];
export type Me = Schemas["Me"];
export type Org = Schemas["Org"];
export type Connection = Schemas["Connection"];
export type FindingSummary = Schemas["FindingSummary"];
export type FindingPage = Schemas["Page_FindingSummary"];
export type Run = Schemas["Run"];
export type Problem = Schemas["Problem"];

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

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

// Requests made before a session exists; brain checks their Origin instead of a CSRF token.
const ANONYMOUS = new Set(["/auth/magic-link", "/auth/magic-link/redeem"]);
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
api.use(withCsrf);
