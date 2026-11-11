import { describe, expect, it } from "vitest";
import { agentsScopeNote, CLAUDE_COMMAND, CLIENTS, cursorDeeplink, kindLabel, STDIO_BRIDGE, vscodeDeeplink } from "@/lib/agents";
import { isOwner } from "@/lib/delivery";

describe("agents", () => {
  it("lists_agents_and_revokes: labels kinds", () => {
    expect(kindLabel("dynamic")).toBe("Registered client");
    expect(kindLabel("metadata_document")).toBe("Published client");
    expect(isOwner("owner")).toBe(true);
  });
  it("member_sees_only_own_rows_message", () => {
    expect(agentsScopeNote("member")).toMatch(/only the agents you connected/);
    expect(agentsScopeNote("owner")).toBeNull();
  });
  it("docs page strings are exact", () => {
    expect(CLAUDE_COMMAND).toBe("claude mcp add --transport http opsagent https://brain.opsagent.dev/mcp");
    const config = cursorDeeplink().split("config=")[1] ?? "";
    expect(JSON.parse(Buffer.from(config, "base64").toString())).toEqual({ url: "https://brain.opsagent.dev/mcp" });
    expect(cursorDeeplink()).toMatch(/^cursor:\/\/anysphere\.cursor-deeplink\/mcp\/install\?name=opsagent&config=/);
  });
  it("vs code link and the stdio bridge point at the MCP URL", () => {
    const cfg = JSON.parse(decodeURIComponent(vscodeDeeplink().replace("vscode:mcp/install?", "")));
    expect(cfg).toEqual({ name: "opsagent", type: "http", url: "https://brain.opsagent.dev/mcp" });
    expect(JSON.parse(STDIO_BRIDGE).mcpServers.opsagent.args).toEqual(["-y", "mcp-remote", "https://brain.opsagent.dev/mcp"]);
  });
  it("every client has a unique anchor, steps, and parseable JSON snippets", () => {
    expect(new Set(CLIENTS.map((c) => c.id)).size).toBe(CLIENTS.length);
    for (const c of CLIENTS) {
      expect(c.steps.length, c.id).toBeGreaterThan(0);
      for (const s of c.snippets ?? []) if (s.label.endsWith(".json") || s.label.endsWith(".jsonc")) expect(() => JSON.parse(s.code), c.id).not.toThrow();
    }
  });
});
