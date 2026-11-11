import { CopyButton } from "@/components/marketing/CopyButton";
import { CLIENTS, MCP_URL, STDIO_BRIDGE, type Snippet } from "@/lib/agents";

export const metadata = {
  title: "Connect your agent · OpsAgent",
  description:
    "Connect Claude, ChatGPT, Cursor, VS Code, Codex, Gemini CLI or any other MCP client to OpsAgent. You approve it in your browser; the agent gets read-only access to one organisation.",
};

function Code({ s, client }: { s: Snippet; client: string }) {
  return (
    <div className="code-panel">
      <div className="code-panel-head">
        <span>{s.label}</span>
        <CopyButton text={s.code} label={`Copy ${client} ${s.label}`} />
      </div>
      <pre>
        <code>{s.code}</code>
      </pre>
    </div>
  );
}

export default function ConnectYourAgent() {
  return (
    <main className="page">
      <h1>Connect your agent</h1>
      <p className="lead">
        OpsAgent speaks MCP, so any AI tool that supports remote MCP servers can read your findings. You sign in and
        approve the connection in your browser; the agent gets read-only access to one organisation.
      </p>
      <div className="code-panel">
        <div className="code-panel-head">
          <span>MCP URL</span>
          <CopyButton text={MCP_URL} label="Copy MCP URL" />
        </div>
        <code>{MCP_URL}</code>
      </div>
      <nav aria-label="Clients" className="client-jump">
        {CLIENTS.map((c) => (
          <a key={c.id} href={`#${c.id}`}>{c.name}</a>
        ))}
        <a href="#other">Other clients</a>
      </nav>
      <div className="client-cards">
        {CLIENTS.map((c) => (
          <section key={c.id} id={c.id}>
            <h2>{c.name}</h2>
            {c.steps.length > 1 ? (
              <ol>{c.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            ) : (
              <p>{c.steps[0]}</p>
            )}
            {c.link && (
              <a className="cursor-link" href={c.link.href}>
                {c.link.label}
              </a>
            )}
            {c.snippets?.map((s) => <Code key={s.label} s={s} client={c.name} />)}
          </section>
        ))}
        <section id="other">
          <h2>Other clients</h2>
          <ol>
            <li>Open your tool&apos;s MCP or connectors settings and add a remote server named OpsAgent.</li>
            <li>
              Choose the Streamable HTTP transport (sometimes called HTTP) and enter <code>{MCP_URL}</code>. Leave
              authentication on OAuth, or empty: OpsAgent tells the client how to sign in.
            </li>
            <li>Follow the sign-in prompt, check the client and organisation, and choose Approve.</li>
          </ol>
          <p>
            If your tool runs only local (stdio) servers, add this bridge instead. It needs Node.js and opens the same
            sign-in in your browser.
          </p>
          <Code s={{ label: "mcp.json", code: STDIO_BRIDGE }} client="local bridge" />
        </section>
      </div>
      <p className="muted">Owners can revoke any agent under Settings, Connected agents.</p>
    </main>
  );
}
