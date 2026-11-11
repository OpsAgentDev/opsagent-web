// Constants and helpers for Connected agents and the Connect your agent docs page.
export const MCP_URL = "https://brain.opsagent.dev/mcp";
export const CLAUDE_COMMAND = `claude mcp add --transport http opsagent ${MCP_URL}`;

export function cursorDeeplink(): string {
  const config = Buffer.from(JSON.stringify({ url: MCP_URL })).toString("base64");
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=opsagent&config=${config}`;
}

export function vscodeDeeplink(): string {
  return `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: "opsagent", type: "http", url: MCP_URL }))}`;
}

export function gooseDeeplink(): string {
  return `goose://extension?url=${encodeURIComponent(MCP_URL)}&type=streamable_http&id=opsagent&name=OpsAgent`;
}

const json = (v: unknown) => JSON.stringify(v, null, 2);

export type Snippet = { label: string; code: string };
export type Client = { id: string; name: string; steps: string[]; snippets?: Snippet[]; link?: { href: string; label: string } };

/** Setup per MCP client, from each vendor's docs (checked 2026-11-11). Every one ends in the browser sign-in. */
export const CLIENTS: Client[] = [
  {
    id: "claude-code", name: "Claude Code",
    steps: ["Run the command, then type /mcp in Claude Code and sign in."],
    snippets: [{ label: "Terminal", code: CLAUDE_COMMAND }],
  },
  {
    id: "claude", name: "Claude (web, desktop and mobile)",
    steps: [
      "Open Customize, then Connectors, choose +, then Add custom connector.",
      "Name it OpsAgent, paste the MCP URL and choose Add. Team and Enterprise owners add it under Organization settings, Connectors.",
      "Choose Connect and sign in. The connector then works in every Claude app.",
    ],
  },
  {
    id: "chatgpt", name: "ChatGPT",
    steps: [
      "On a plan that allows custom MCP servers, open Settings, Apps and connectors (enable Developer mode under Advanced if your plan asks for it).",
      "Add a custom connector or MCP server, paste the MCP URL and choose OAuth.",
      "Create it and sign in.",
    ],
  },
  {
    id: "codex", name: "OpenAI Codex CLI",
    steps: ["Add the server, then sign in."],
    snippets: [
      { label: "Terminal", code: `codex mcp add opsagent --url ${MCP_URL}\ncodex mcp login opsagent` },
      { label: "~/.codex/config.toml", code: `[mcp_servers.opsagent]\nurl = "${MCP_URL}"` },
    ],
  },
  {
    id: "gemini", name: "Gemini CLI",
    steps: ["Add the server, then run /mcp auth opsagent inside Gemini CLI."],
    snippets: [
      { label: "Terminal", code: `gemini mcp add --transport http opsagent ${MCP_URL}` },
      { label: "~/.gemini/settings.json", code: json({ mcpServers: { opsagent: { httpUrl: MCP_URL } } }) },
    ],
  },
  {
    id: "cursor", name: "Cursor",
    steps: ["Use the button, or add the server to ~/.cursor/mcp.json. Cursor asks you to sign in."],
    link: { href: cursorDeeplink(), label: "Add OpsAgent to Cursor" },
    snippets: [{ label: "~/.cursor/mcp.json", code: json({ mcpServers: { opsagent: { url: MCP_URL } } }) }],
  },
  {
    id: "vscode", name: "VS Code (GitHub Copilot)",
    steps: ["Use the button, or add the server to .vscode/mcp.json and choose Start. Copilot asks you to sign in."],
    link: { href: vscodeDeeplink(), label: "Add OpsAgent to VS Code" },
    snippets: [{ label: ".vscode/mcp.json", code: json({ servers: { opsagent: { type: "http", url: MCP_URL } } }) }],
  },
  {
    id: "windsurf", name: "Windsurf",
    steps: ["Open Cascade, MCP servers, View raw config, add the server and refresh. Windsurf asks you to sign in."],
    snippets: [{ label: "~/.codeium/windsurf/mcp_config.json", code: json({ mcpServers: { opsagent: { serverUrl: MCP_URL } } }) }],
  },
  {
    id: "zed", name: "Zed",
    steps: ["Add the server to your Zed settings.json. Zed asks you to sign in."],
    snippets: [{ label: "settings.json", code: json({ context_servers: { opsagent: { url: MCP_URL } } }) }],
  },
  {
    id: "jetbrains", name: "JetBrains (Junie and AI Assistant)",
    steps: [
      "Junie: add the server to ~/.junie/mcp/mcp.json, select it and choose Authorize.",
      "AI Assistant: Settings, Tools, AI Assistant, Model Context Protocol (MCP), Add, then paste the same JSON.",
    ],
    snippets: [{ label: "mcp.json", code: json({ mcpServers: { opsagent: { url: MCP_URL } } }) }],
  },
  {
    id: "amp", name: "Amp",
    steps: ["Add the server. Amp opens your browser to sign in on first use."],
    snippets: [{ label: "Terminal", code: `amp mcp add opsagent ${MCP_URL}` }],
  },
  {
    id: "kiro", name: "Kiro",
    steps: ["Add the server to ~/.kiro/settings/mcp.json. Kiro asks you to sign in."],
    snippets: [{ label: "~/.kiro/settings/mcp.json", code: json({ mcpServers: { opsagent: { url: MCP_URL } } }) }],
  },
  {
    id: "opencode", name: "opencode",
    steps: ["Add the server to opencode.jsonc, then run opencode mcp auth opsagent."],
    snippets: [{ label: "opencode.jsonc", code: json({ mcp: { servers: { opsagent: { type: "remote", url: MCP_URL } } } }) }],
  },
  {
    id: "goose", name: "Goose",
    steps: ["Use the button, or run goose configure, Add Extension, Remote Extension (Streamable HTTP), and paste the MCP URL."],
    link: { href: gooseDeeplink(), label: "Add OpsAgent to Goose" },
  },
  {
    id: "warp", name: "Warp",
    steps: ["Open Settings, Agents, MCP servers, choose + Add, then Streamable HTTP or SSE Server (URL), and paste the JSON. Warp opens your browser to sign in."],
    snippets: [{ label: "MCP server", code: json({ opsagent: { url: MCP_URL } }) }],
  },
  {
    id: "cline", name: "Cline",
    steps: ["Open MCP Servers, Configure, and add the server. If it does not prompt you to sign in, use the local bridge under Other clients."],
    snippets: [{ label: "cline_mcp_settings.json", code: json({ mcpServers: { opsagent: { type: "streamableHttp", url: MCP_URL } } }) }],
  },
  {
    id: "continue", name: "Continue",
    steps: ["Continue does not document MCP sign-in, so use the local bridge under Other clients, in .continue/mcpServers/opsagent.yaml."],
  },
  {
    id: "lm-studio", name: "LM Studio",
    steps: ["LM Studio does not document MCP sign-in, so add the local bridge under Other clients in Program, Install, Edit mcp.json."],
  },
];

/** For clients that run only local (stdio) servers: mcp-remote bridges to the MCP URL and handles sign-in. */
export const STDIO_BRIDGE = json({ mcpServers: { opsagent: { command: "npx", args: ["-y", "mcp-remote", MCP_URL] } } });

export const KIND_LABELS: Record<string, string> = { dynamic: "Registered client", metadata_document: "Published client" };
export const kindLabel = (kind: string) => KIND_LABELS[kind] ?? kind;

/** Brain lists every grant to owners and only their own to members; say so. */
export function agentsScopeNote(role?: string | null): string | null {
  return role === "owner" ? null : "You see only the agents you connected. An owner sees all of them.";
}
