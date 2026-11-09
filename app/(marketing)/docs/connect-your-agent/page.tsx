import { CopyButton } from "@/components/marketing/CopyButton";
import { CLAUDE_COMMAND, cursorDeeplink, MCP_URL } from "@/lib/agents";

export const metadata = {
  title: "Connect your agent · OpsAgent",
  description: "Connect Claude, Cursor or another MCP client to OpsAgent. You approve it in your browser; the agent gets read-only access to one organisation.",
};

export default function ConnectYourAgent() {
  return (
    <main className="page">
      <h1>Connect your agent</h1>
      <p className="lead">
        OpsAgent speaks MCP, so Claude, Cursor and other AI tools can read your findings. You sign in and approve the
        connection in your browser; the agent gets read-only access to one organisation.
      </p>
      <div className="code-panel">
        <div className="code-panel-head">
          <span>MCP URL</span>
          <CopyButton text={MCP_URL} label="Copy MCP URL" />
        </div>
        <code>{MCP_URL}</code>
      </div>
      <div className="client-cards">
        <section>
          <h2>Claude Code</h2>
          <div className="code-panel">
            <div className="code-panel-head">
              <span>Terminal</span>
              <CopyButton text={CLAUDE_COMMAND} label="Copy Claude Code command" />
            </div>
            <pre>
              <code>{CLAUDE_COMMAND}</code>
            </pre>
          </div>
        </section>
        <section>
          <h2>Cursor</h2>
          <a className="cursor-link" href={cursorDeeplink()}>
            Add OpsAgent to Cursor
          </a>
        </section>
        <section>
          <h2>Other clients</h2>
          <ol>
            <li>Open your tool&apos;s MCP or connectors settings and add a remote server.</li>
            <li>
              Choose the Streamable HTTP transport and enter <code>{MCP_URL}</code>.
            </li>
            <li>Follow the sign-in prompt, check the client and organisation, and choose Approve.</li>
          </ol>
        </section>
      </div>
      <p className="muted">Owners can revoke any agent under Settings, Connected agents.</p>
    </main>
  );
}
