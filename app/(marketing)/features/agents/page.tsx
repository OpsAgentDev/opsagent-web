import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/marketing/CopyButton";
import { FeaturePage, FeatureSection } from "@/components/marketing/FeaturePage";
import * as I from "@/components/marketing/landing-icons";
import { MCP_URL } from "@/lib/agents";

export const metadata: Metadata = {
  title: "Connect your agent · OpsAgent",
  description: "Point Claude, Cursor or any MCP client at OpsAgent. Your agent reads findings and evidence, read-only, for one organisation you approve.",
};

export default function Agents() {
  return (
    <FeaturePage
      slug="agents"
      title="Connect your agent"
      lead="Ask your own AI tool about your cloud. Claude, Cursor and other MCP clients can read what OpsAgent found, in plain words, where you already work."
    >
      <div className="code-panel">
        <div className="code-panel-head">
          <span>MCP URL</span>
          <CopyButton text={MCP_URL} label="Copy MCP URL" />
        </div>
        <code>{MCP_URL}</code>
      </div>
      <FeatureSection Icon={I.ChatSquareIcon} title="What MCP is">
        <p>
          MCP, the Model Context Protocol, is an open standard that lets AI tools read data from other services. OpsAgent
          runs an MCP server, so your agent can look up your findings when you ask it.
        </p>
      </FeatureSection>
      <FeatureSection Icon={I.NoWriteIcon} title="What your agent can read">
        <p>
          Findings and the evidence behind them, resources, connections, scans and cost anomalies. Every tool is
          read-only: nothing your agent asks for can change your cloud.
        </p>
        <p>
          Access covers one organisation, the one you pick when you approve. Your agent uses its own model; OpsAgent
          makes no model calls over MCP.
        </p>
      </FeatureSection>
      <FeatureSection Icon={I.KeyIcon} title="Approve it in your browser">
        <p>
          Add the MCP URL to your tool. It opens OpsAgent in your browser, where you sign in, check the client and the
          organisation, and choose Approve. There is no API key to paste.
        </p>
      </FeatureSection>
      <FeatureSection Icon={I.ToggleIcon} title="Revoke any agent">
        <p>
          Owners see every connected agent under Settings, Connected agents, and can revoke any of them. When a member
          leaves the organisation, their agents lose access too.
        </p>
      </FeatureSection>
      <p className="feature-more">
        <Link href="/docs/connect-your-agent">Set it up in Claude Code, Cursor or another client</Link>
      </p>
    </FeaturePage>
  );
}
