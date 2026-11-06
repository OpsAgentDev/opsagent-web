// "Skip for now" on the setup checklist is remembered per browser and organisation; storage may be unavailable.
const key = (org: string) => `setup-skipped:${org}`;

export function isSkipped(org: string): boolean {
  try { return localStorage.getItem(key(org)) === "1"; } catch { return false; }
}

export function setSkipped(org: string, on: boolean): void {
  try {
    if (on) localStorage.setItem(key(org), "1");
    else localStorage.removeItem(key(org));
  } catch { /* not remembered */ }
}
