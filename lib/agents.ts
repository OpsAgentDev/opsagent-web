// Constants and helpers for Connected agents and the Connect your agent docs page.
export const MCP_URL = "https://brain.opsagent.dev/mcp";
export const CLAUDE_COMMAND = `claude mcp add --transport http opsagent ${MCP_URL}`;

export function cursorDeeplink(): string {
  const config = Buffer.from(JSON.stringify({ url: MCP_URL })).toString("base64");
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=opsagent&config=${config}`;
}

export const KIND_LABELS: Record<string, string> = { dynamic: "Registered client", metadata_document: "Published client" };
export const kindLabel = (kind: string) => KIND_LABELS[kind] ?? kind;

/** Brain lists every grant to owners and only their own to members; say so. */
export function agentsScopeNote(role?: string | null): string | null {
  return role === "owner" ? null : "You see only the agents you connected. An owner sees all of them.";
}
