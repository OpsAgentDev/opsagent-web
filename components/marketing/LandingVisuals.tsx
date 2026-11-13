import type { ReactNode } from "react";
import { Severity } from "@/components/badges";
import { Logo, Mark } from "@/components/brand/Logo";
import { Live } from "@/components/marketing/Live";
import { OverviewTiles } from "@/components/overview-tiles";
import { IssueList } from "@/components/top-issues";
import { TrendChart } from "@/components/trend-chart";

/**
 * The home page's product visuals, drawn in HTML. Wording follows what brain really sends
 * (briefing and alert text, finding titles, evidence excerpts, MCP tool names); the account
 * and resources are invented, so every visual carries a Sample tag.
 */

const SNAPSHOT = "orders-db-2026-11-03";

/** The window chrome every sample shares: three dots, a title, and the Sample tag where the content is invented. */
function Chrome({ title, sample = true }: { title: ReactNode; sample?: boolean }) {
  return (
    <div className="lp-frame-bar">
      <span className="lp-dots" aria-hidden="true"><i /><i /><i /></span>
      <span className="lp-frame-title">{title}</span>
      {sample && <span className="lp-sample">Sample</span>}
    </div>
  );
}

function Frame({ label, title, className, children }: { label: string; title: ReactNode; className?: string; children: ReactNode }) {
  return (
    <figure className={className ? `lp-frame ${className}` : "lp-frame"} aria-label={label}>
      <Chrome title={title} />
      {children}
    </figure>
  );
}

function SlackMessage({ time, children }: { time: string; children: ReactNode }) {
  return (
    <div className="lp-msg">
      <Mark size={36} />
      <div className="lp-msg-body">
        <p className="lp-msg-head">
          <strong>OpsAgent</strong>
          <span className="lp-app">App</span>
          <time>{time}</time>
        </p>
        {/* Shown for a moment before the message arrives; decoration only. */}
        <span className="lp-typing" aria-hidden="true"><i /><i /><i /></span>
        {children}
      </div>
    </div>
  );
}

/** The morning briefing as it is posted to Slack. */
export function SlackBriefing() {
  return (
    <Frame label="Sample morning briefing in Slack" title="# ops" className="lp-slack">
      <SlackMessage time="08:00">
        <p><strong>OpsAgent morning briefing</strong></p>
        <p><strong>New critical and high</strong> (3)</p>
        <ul>
          <li>Critical: Snapshot {SNAPSHOT} is public (alerted 03:12)</li>
          <li>High: Certificate api.acme.example expires in 21 days</li>
          <li>High: deploy-bot has administrator access</li>
        </ul>
        <p><strong>Resolved critical</strong> (1)</p>
        <ul>
          <li>Critical: Database orders-db is publicly accessible</li>
        </ul>
        <p>Open now: 1 critical, 2 high, 3 medium, 0 low, 0 info</p>
        <p className="lp-msg-link">Open the dashboard</p>
      </SlackMessage>
    </Frame>
  );
}

/** One urgent alert, as it is posted to Slack between briefings. */
export function SlackAlert() {
  return (
    <Frame label="Sample urgent alert in Slack" title="# ops" className="lp-slack">
      <SlackMessage time="03:12">
        <p className="lp-urgent"><span className="lp-dot sev-critical" aria-hidden="true" /><strong>Urgent: Snapshot {SNAPSHOT} is public</strong></p>
        <p>{SNAPSHOT} · acme-prod · us-east-1</p>
        <p>Make the snapshot private.</p>
        <p className="lp-msg-link">View finding</p>
      </SlackMessage>
    </Frame>
  );
}

type Sev = "critical" | "high" | "medium";
const FINDINGS: { sev: Sev; title: string; resource: string }[] = [
  { sev: "critical", title: `Snapshot ${SNAPSHOT} is public`, resource: SNAPSHOT },
  { sev: "high", title: "Certificate api.acme.example expires in 21 days", resource: "api.acme.example" },
  { sev: "high", title: "deploy-bot has administrator access", resource: "deploy-bot" },
  { sev: "medium", title: "Access key of ci-deploy is over 90 days old", resource: "ci-deploy" },
  { sev: "medium", title: "orders-db is not in any backup plan", resource: "orders-db" },
  { sev: "medium", title: "Bucket assets-old has no block-public-access", resource: "assets-old" },
];
const COUNTS: [Sev, number][] = [["critical", 1], ["high", 2], ["medium", 3]];

/** The dashboard's findings list, with the first finding opened to its evidence. */
export function FindingsPanel() {
  return (
    <Frame label="Sample findings list for the account acme-prod" title="Findings, acme-prod" className="lp-findings">
      <div className="lp-counts">
        <div className="lp-bar" aria-hidden="true">
          {COUNTS.map(([sev, n]) => <span key={sev} className={`sev-${sev}`} style={{ flexGrow: n }} />)}
        </div>
        <p>6 open: {COUNTS.map(([sev, n]) => `${n} ${sev}`).join(", ")}</p>
      </div>
      <ol>
        {FINDINGS.map((f, i) => (
          <li key={f.title}>
            <Severity value={f.sev} />
            <span className="lp-finding-title">{f.title}</span>
            <code className="lp-res">{f.resource}</code>
            {i === 0 && (
              <dl className="lp-evidence">
                <dt>Evidence</dt>
                <dd><code>snapshot=true public=true</code></dd>
                <dt>Next step</dt>
                <dd>Make the snapshot private.</dd>
              </dl>
            )}
          </li>
        ))}
      </ol>
    </Frame>
  );
}

const ACCESS: { ok: boolean; what: string }[] = [
  { ok: true, what: "How your cloud is set up: configuration and metadata" },
  { ok: true, what: "What it costs: billing data" },
  { ok: false, what: "Create, change, stop or delete anything" },
  { ok: false, what: "Stored objects" },
  { ok: false, what: "Database rows" },
  { ok: false, what: "Secret values" },
];

/** A plain-words summary of what the read-only role allows; the exceptions live on the Security page. */
export function AccessLedger({ foot }: { foot: ReactNode }) {
  return (
    <figure className="lp-frame lp-ledger" aria-label="What the OpsAgent role can and cannot do">
      <Chrome title="The OpsAgent role in your account" sample={false} />
      <ul>
        {ACCESS.map((a) => (
          <li key={a.what} className={a.ok ? "is-ok" : "is-no"}>
            <span className="lp-verdict">{a.ok ? "Can read" : "Cannot"}</span>
            <span>{a.what}</span>
          </li>
        ))}
      </ul>
      <figcaption>{foot}</figcaption>
    </figure>
  );
}

/** A coding agent asking OpsAgent over MCP; the tool and its arguments are the real ones. */
export function AgentSession() {
  return (
    <Frame label="Sample session: an AI agent reading findings from OpsAgent over MCP" title="Your agent, in a terminal" className="lp-term">
      <div className="lp-term-body">
        <p className="lp-ask"><span aria-hidden="true">&gt; </span>Is anything critical open in our cloud?</p>
        <p className="lp-call">
          <span className="lp-dot sev-ok" aria-hidden="true" />
          opsagent: list_findings <span className="lp-args">(status: &quot;open&quot;, severity: &quot;critical&quot;)</span>
        </p>
        <p className="lp-result">1 finding returned</p>
        <p className="lp-answer">
          One critical finding is open on acme-prod. Snapshot {SNAPSHOT} is public. The evidence is{" "}
          <code>snapshot=true public=true</code>. OpsAgent&apos;s next step: make the snapshot private.
        </p>
      </div>
    </Frame>
  );
}

// Real check names, for the status pill.
const SCANNING = ["Public exposure", "IAM hygiene", "Backup coverage", "Certificate expiry"];
const NAV = ["Dashboard", "Findings", "Ask OpsAgent", "Deliveries"];
const SETTINGS = ["Delivery settings", "Members", "Billing"];
// Fourteen nightly scans ending at the six open findings the other samples show.
const TREND = [12, 12, 11, 11, 10, 10, 9, 9, 8, 8, 8, 7, 7, 6].map((open, i) => ({
  at: `2026-11-${String(i + 1).padStart(2, "0")}T12:00:00Z`, open, critical: i === 13 ? 1 : 0,
}));

/** The hero: the dashboard overview, built from the app's own tiles, chart and issue list with sample numbers. */
export function DashboardSample() {
  return (
    <Live className="lp-dash-live">
    <figure className="lp-dash" aria-label="Sample dashboard for the account acme-prod">
      <Chrome title="opsagent.dev/dashboard" />
      <div className="lp-dash-app">
      <div className="lp-dash-side" aria-hidden="true">
        <p className="lp-dash-logo"><Logo size={20} /></p>
        {NAV.map((n, i) => <p key={n} className={i ? "lp-dash-nav" : "lp-dash-nav on"}><i />{n}</p>)}
        <p className="lp-dash-label">Settings</p>
        {SETTINGS.map((n) => <p key={n} className="lp-dash-nav"><i />{n}</p>)}
      </div>
      <div className="lp-dash-main">
        <div className="lp-dash-top">
          <p className="lp-dash-org"><span aria-hidden="true">A</span>Acme</p>
          <span className="lp-dash-who">sam@acme.example</span>
        </div>
        <div className="lp-dash-body">
          <div className="ov-greet">
            <p className="ov-hello">Good morning</p>
            {/* The window is "running": a status pill that cycles through real check names. Decoration, so hidden from assistive tech. */}
            <p className="ov-live lp-scan" data-state="scanning" aria-hidden="true">
              <i />Scanning acme-prod
              <span className="lp-scan-names">{SCANNING.map((c) => <b key={c}>{c}</b>)}</span>
            </p>
            <p className="ov-line">Last scan 14 Nov, 02:00. 1 new critical since the previous scan.</p>
          </div>
          <OverviewTiles overview={{ score: 72, open: 6, urgent: 3, connected: 1 }} total={1} since={{ openDelta: -1, newCritical: 1 }} />
          <div className="ov-two">
            <TrendChart points={TREND} />
            <div className="ov-panel">
              <div className="ov-head"><p className="ov-title">Fix these first</p></div>
              <IssueList label="Sample findings to fix first" linked={false} items={FINDINGS.slice(0, 3).map((f) => ({ id: f.title, severity: f.sev, title: f.title, resource_identity: f.resource }))} />
              {/* A finding "arrives" in the loop; its space is always reserved, so nothing moves. */}
              <div className="lp-arrival" aria-hidden="true">
                <IssueList label="" linked={false} items={[{ id: "new", severity: "high", title: "Security group sg-web exposes an admin or database port to the world", resource_identity: "sg-web" }]} />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </figure>
    </Live>
  );
}
