import { describe, expect, it } from "vitest";
import { agentsScopeNote, CLAUDE_COMMAND, cursorDeeplink, kindLabel } from "@/lib/agents";
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
});
