"use client";

import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { Mark } from "@/components/brand/Logo";
import { AlertCard } from "@/components/marketing/AlertCard";
import { BriefingCard } from "@/components/marketing/BriefingCard";
import { ADVANCE_MS, TABS, TAB_LABEL, demoReducer, initialState, nextIndex, type TabId } from "@/lib/alert-demo";

/** Panel frame matching AlertCard and BriefingCard, so every tab reads as the same product. */
function Panel({ title, meta, sample = "Sample", foot, children }: { title: string; meta: string; sample?: string; foot: string; children: ReactNode }) {
  return (
    <figure className="briefing">
      <div className="briefing-head">
        <Mark size={28} />
        <div>
          <p className="briefing-title">{title}</p>
          <p className="briefing-meta">{meta}</p>
        </div>
        <span className="briefing-sample">{sample}</span>
      </div>
      {children}
      <figcaption className="briefing-foot">{foot}</figcaption>
    </figure>
  );
}

// 22:00 to 08:00 in 15-minute runs; the alert went out at 03:12, 5h12m into the night.
const RUNS = Array.from({ length: 41 }, (_, i) => i);
const ALERT_AT = `${((5 * 60 + 12) / 600) * 100}%`;

function Overnight() {
  return (
    <Panel title="While you slept" meta="22:00–08:00" sample="Sample night" foot="Everything else waits for your morning briefing.">
      <div className="demo-body">
        <ul className="demo-stats">
          <li><strong>Every 15 minutes</strong><span>urgent checks</span></li>
          <li><strong className="is-bad">1 urgent alert</strong><span>sent at 03:12</span></li>
          <li><strong className="is-ok">0 changes</strong><span>to your cloud</span></li>
        </ul>
        <div className="demo-night" aria-hidden="true">
          <div className="demo-ticks">
            {RUNS.map((i) => <span key={i} className={i % 4 === 0 ? "hour" : undefined} />)}
            <span className="demo-alert-mark" style={{ left: ALERT_AT }}>03:12</span>
          </div>
          <div className="demo-axis"><span>22:00</span><span>03:00</span><span>08:00</span></div>
        </div>
        <ol className="demo-events">
          <li><time>03:12</time><p><strong>Urgent alert sent to #ops</strong><span>Database <code>prod-db</code> snapshot left public</span></p></li>
          <li><time>08:00</time><p><strong>Morning briefing</strong><span>One short briefing in #ops</span></p></li>
        </ol>
      </div>
    </Panel>
  );
}

const LOG: { at: string; text: ReactNode; status: string; bad?: boolean; next?: boolean }[] = [
  { at: "02:30", text: "Public exposure", status: "clear" },
  { at: "02:45", text: "Public exposure", status: "clear" },
  { at: "03:00", text: "Public exposure", status: "clear" },
  { at: "03:12", text: <>Database <code>prod-db</code> snapshot left public</>, status: "alert sent", bad: true },
  { at: "03:15", text: "Public exposure", status: "next", next: true },
];

function NightWatch() {
  return (
    <Panel title="Night watch" meta="Public exposure checks" foot="Urgent exposures are checked every 15 minutes, day and night.">
      <ol className="demo-log">
        {LOG.map((l) => (
          <li key={l.at} className={l.bad ? "is-new" : l.next ? "is-next" : undefined}>
            <time>{l.at}</time>
            <span className="demo-log-text">{l.text}</span>
            <span className={`demo-pill ${l.bad ? "pill-bad" : l.next ? "pill-next" : "pill-ok"}`}>{l.status}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

const FINDINGS: { sev: "bad" | "warn"; label: string; check: string; title: ReactNode }[] = [
  { sev: "bad", label: "Critical", check: "Public exposure", title: <>Database <code>prod-db</code> snapshot left public</> },
  { sev: "warn", label: "Needs attention", check: "IAM", title: <>2 keys of <code>ci-deploy</code> unused for 180 days</> },
  { sev: "warn", label: "Needs attention", check: "Backups", title: <>No backup plan covers <code>orders-db</code></> },
  { sev: "warn", label: "Needs attention", check: "Cost", title: <>Load balancer <code>lb-staging</code> idle for 30 days</> },
  { sev: "warn", label: "Needs attention", check: "Certificates", title: <>Certificate for <code>api.example.com</code> expires in 12 days</> },
];

function Everything() {
  return (
    <Panel title="All findings" meta="Every check, with evidence" foot="Every finding names the resource and shows the evidence.">
      <ul className="demo-findings">
        {FINDINGS.map((f) => (
          <li key={f.check}>
            <span className={`dot dot-${f.sev}`} role="img" aria-label={f.label} />
            <span className="demo-finding">
              <span className="demo-check">{f.check}</span>
              <span className="demo-finding-title">{f.title}</span>
            </span>
            <span className="demo-evidence">Evidence</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const PANELS: Record<TabId, () => ReactNode> = {
  overnight: Overnight,
  "night-watch": NightWatch,
  morning: BriefingCard,
  urgent: AlertCard,
  everything: Everything,
};

export function AlertDemo() {
  const [state, dispatch] = useReducer(demoReducer, false, initialState);
  const [mounted, setMounted] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const { index, mode } = state;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) dispatch({ type: "interact" });
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mode !== "auto") return;
    const id = setInterval(() => dispatch({ type: "tick" }), ADVANCE_MS);
    return () => clearInterval(id);
  }, [mode, index]);

  // Keep the selected tab in view when the tab list scrolls on narrow screens; scrolls the list, never the page.
  useEffect(() => {
    const tab = tabs.current[index];
    const list = tab?.parentElement;
    if (tab && list && list.scrollWidth > list.clientWidth) list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2 });
  }, [index]);

  function onKeyDown(e: React.KeyboardEvent) {
    const next = nextIndex(index, e.key, TABS.length);
    if (next === null) return;
    e.preventDefault();
    dispatch({ type: "select", index: next });
    tabs.current[next]?.focus();
  }

  return (
    <div
      className="demo"
      onMouseEnter={() => dispatch({ type: "hover" })}
      onMouseLeave={() => dispatch({ type: "leave" })}
      onFocus={() => dispatch({ type: "interact" })}
      onPointerDown={() => dispatch({ type: "interact" })}
    >
      <div className="demo-tabs" role="tablist" aria-label="What OpsAgent sends, by moment" onKeyDown={onKeyDown}>
        {TABS.map((t, i) => (
          <button
            key={t}
            ref={(el) => { tabs.current[i] = el; }}
            type="button"
            role="tab"
            id={`demo-tab-${t}`}
            aria-selected={i === index}
            aria-controls={`demo-panel-${t}`}
            tabIndex={i === index ? 0 : -1}
            onClick={() => dispatch({ type: "select", index: i })}
          >
            {TAB_LABEL[t]}
            {i === index && mounted && mode === "auto" && <span className="demo-progress" style={{ animationDuration: `${ADVANCE_MS}ms` }} aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className="demo-panels">
        {TABS.map((t, i) => {
          const Content = PANELS[t];
          return (
            <div key={t} className="demo-panel" role="tabpanel" id={`demo-panel-${t}`} aria-labelledby={`demo-tab-${t}`} tabIndex={0} hidden={i !== index}>
              <Content />
            </div>
          );
        })}
      </div>
    </div>
  );
}
