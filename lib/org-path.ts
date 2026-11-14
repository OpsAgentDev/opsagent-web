// In-app addresses carry the organisation: /o/<slug>/dashboard. next.config.ts rewrites them to the same pages
// without the prefix, so the pages themselves stay where they are.

/** `/o/acme/findings/1` → `{ slug: "acme", path: "/findings/1" }`; an address without the prefix has no slug. */
export function splitOrgPath(pathname: string): { slug: string | null; path: string } {
  const m = /^\/o\/([^/]+)(\/.*)?$/.exec(pathname);
  if (!m) return { slug: null, path: pathname };
  let slug: string | null = null;
  // A malformed % escape names no organisation; the layout then corrects the address like any unknown slug.
  try { slug = decodeURIComponent(m[1]!); } catch { /* slug stays null */ }
  return { slug, path: m[2] ?? "/dashboard" };
}

/** The address of an in-app path inside an organisation. */
export function orgHref(slug: string, path: string): string {
  return `/o/${encodeURIComponent(slug)}${path}`;
}
