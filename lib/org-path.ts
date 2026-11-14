// In-app addresses carry the organisation: /o/<slug>/dashboard. next.config.ts rewrites them to the same pages
// without the prefix, so the pages themselves stay where they are.

/** `/o/acme/findings/1` → `{ slug: "acme", path: "/findings/1" }`; an address without the prefix has no slug. */
export function splitOrgPath(pathname: string): { slug: string | null; path: string } {
  const m = /^\/o\/([^/]+)(\/.*)?$/.exec(pathname);
  return m ? { slug: decodeURIComponent(m[1]!), path: m[2] ?? "/dashboard" } : { slug: null, path: pathname };
}

/** The address of an in-app path inside an organisation. */
export function orgHref(slug: string, path: string): string {
  return `/o/${encodeURIComponent(slug)}${path}`;
}
