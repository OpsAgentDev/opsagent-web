import { CopyButton } from "@/components/marketing/CopyButton";
import { longDate } from "@/components/marketing/CompareView";
import { FeaturePage, FeatureSection } from "@/components/marketing/FeaturePage";
import * as I from "@/components/marketing/landing-icons";
import type { ProblemEntry } from "@/lib/marketing/problems";

const Source = ({ href, what }: { href: string; what: string }) => (
  <a href={href} rel="noopener noreferrer" target="_blank" aria-label={`AWS docs for ${what}`}>AWS docs</a>
);

const Command = ({ text }: { text: string }) => (
  <div className="code-panel">
    <div className="code-panel-head">
      <span>Run this</span>
      <CopyButton text={text} label="Copy the command" />
    </div>
    <pre><code>{text}</code></pre>
  </div>
);

/** One problem page, rendered from its data entry. */
export function ProblemView({ entry }: { entry: ProblemEntry }) {
  return (
    <FeaturePage slug={`problem-${entry.slug}`} kicker="Fix it" title={entry.heading} lead={entry.lead}>
      <p className="compare-asof">AWS details read from the AWS docs on {longDate(entry.asOf)}. Each one links to its page.</p>
      <FeatureSection Icon={I.ShieldIcon} title="What AWS says">
        <ul>
          {entry.facts.map((f) => (
            <li key={f.text}>{f.text} <Source href={f.sourceUrl} what={f.text.slice(0, 40)} /></li>
          ))}
        </ul>
      </FeatureSection>
      <FeatureSection Icon={I.GlobeIcon} title="Find it in your account">
        <p>{entry.find.text} <Source href={entry.find.sourceUrl} what="finding it" /></p>
        <Command text={entry.find.command} />
        {entry.tool && <p><a href={entry.tool.href}>{entry.tool.label}</a>. It runs in your browser and uploads nothing.</p>}
      </FeatureSection>
      <FeatureSection Icon={I.CheckIcon} title="Fix it">
        <ol>
          {entry.steps.map((s) => (
            <li key={s.text}>
              {s.text} <Source href={s.sourceUrl} what={s.text.slice(0, 40)} />
              {s.command && <Command text={s.command} />}
            </li>
          ))}
        </ol>
      </FeatureSection>
      <FeatureSection Icon={I.BellIcon} title="What OpsAgent flags">
        <p>OpsAgent runs {entry.check} against your AWS account every night and flags:</p>
        <ul>
          {entry.flags.map((f) => <li key={f}>{f}</li>)}
        </ul>
      </FeatureSection>
      <FeatureSection Icon={I.NoWriteIcon} title="What OpsAgent does not do here">
        <ul>
          {entry.cannot.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </FeatureSection>
    </FeaturePage>
  );
}
