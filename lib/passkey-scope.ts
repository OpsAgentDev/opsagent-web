/** Where the passkey card may show: the dashboard once the setup checklist is closed (it carries the nudge while open), and Settings → Security. */
export function showPasskeyPrompt(p: { hasPasskey: boolean; pathname: string; checklistOpen: boolean | null }): boolean {
  if (p.hasPasskey) return false;
  if (p.pathname === "/settings/security") return true;
  return p.pathname === "/dashboard" && p.checklistOpen === false;
}
