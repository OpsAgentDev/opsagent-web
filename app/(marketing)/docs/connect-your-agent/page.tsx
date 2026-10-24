import { CLAUDE_COMMAND, cursorDeeplink, MCP_URL } from "@/lib/agents";

export const metadata = { title: "Connect your agent · OpsAgent" };

export default function ConnectYourAgent() {
  return (
    <main>
      <h1>Connect your agent</h1>
      <p>
        OpsAgent speaks MCP, so Claude, Cursor and other AI tools can read your findings. You sign in and approve the
        connection in your browser; the agent gets read-only access to one organisation.
      </p>
      <p>
        MCP URL: <code>{MCP_URL}</code>
      </p>
      <h2>Claude Code</h2>
      <pre>
        <code>{CLAUDE_COMMAND}</code>
      </pre>
      <h2>Cursor</h2>
      <p>
        <a href={cursorDeeplink()}>Add OpsAgent to Cursor</a>
      </p>
      <h2>Other clients</h2>
      <ol>
        <li>Open your tool&apos;s MCP or connectors settings and add a remote server.</li>
        <li>
          Choose the Streamable HTTP transport and enter <code>{MCP_URL}</code>.
        </li>
        <li>Follow the sign-in prompt, check the client and organisation, and choose Approve.</li>
      </ol>
      <p className="muted">Owners can revoke any agent under Settings, Connected agents.</p>
    </main>
  );
}
