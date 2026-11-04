import type { Metadata } from "next";
import Link from "next/link";
import { AlertDemo } from "@/components/marketing/AlertDemo";
import { FeaturePage, FeatureSection } from "@/components/marketing/FeaturePage";
import * as I from "@/components/marketing/landing-icons";
import "../../landing.css";

export const metadata: Metadata = {
  title: "Alerts and briefings · OpsAgent",
  description: "Urgent exposures reach you in Slack within minutes. Everything else waits for one short morning briefing and a weekly report.",
};

const MOMENTS: [string, string][] = [
  ["Overnight", "While you sleep, urgent exposures are checked every 15 minutes. Nothing in your cloud is changed."],
  ["Night watch", "Each 15-minute check either comes back clear or finds something new."],
  ["Morning briefing", "One short message with what changed since yesterday, exceptions only."],
  ["Urgent", "A new critical finding is sent right away, at any hour, with the resource and the evidence."],
  ["Everything", "Every finding, in the dashboard, names the resource and shows the evidence."],
];

export default function Alerts() {
  return (
    <FeaturePage
      slug="alerts"
      title="Alerts and briefings"
      lead="Urgent problems reach you the moment they matter. Everything else waits for one calm morning briefing, and a weekly report sums up the week."
    >
      <div className="feature-demo">
        <AlertDemo />
      </div>
      <section aria-labelledby="moments-h">
        <h2 id="moments-h">Five moments</h2>
        <ul className="moments">
          {MOMENTS.map(([title, body]) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ul>
      </section>
      <FeatureSection Icon={I.BellIcon} title="Urgent alerts">
        <p>
          When a scan opens a new critical finding, OpsAgent sends one alert straight away. The 15-minute checks look
          for public snapshots and databases, admin and database ports open to the internet, and audit logging that
          is switched off. Criticals the nightly scan finds alert as soon as it finishes.
        </p>
        <p>
          High, medium and low findings never interrupt you; they wait for the briefing. An alert says no more than the
          finding does in the dashboard, and the briefing marks it as already alerted.
        </p>
        <p>Urgent alerts are on by default. Owners can switch them off per connection in delivery settings.</p>
      </FeatureSection>
      <FeatureSection Icon={I.SunIcon} title="Morning briefing">
        <p>
          New critical and high findings, findings that got worse, criticals that were resolved, and the health of your
          connections, in that order. At most 10 items, with counts and a link to the dashboard.
        </p>
        <p>Skipped when nothing changed.</p>
      </FeatureSection>
      <FeatureSection Icon={I.MailIcon} title="Weekly report">
        <p>
          Every Monday, by email and in Slack: spend changes and anomalies with dollar amounts, one recommended cost
          action, the change in your posture score, IAM changes, backup status and the certificate calendar.
        </p>
      </FeatureSection>
      <FeatureSection Icon={I.ChatSquareIcon} title="Where it goes">
        <p>
          Alerts and briefings go to the Slack channel you choose. When Slack isn&apos;t connected, the owners get an
          email instead. Each connection can have its own channel and recipients.
        </p>
        <p>
          It is not an on-call tool: no escalation, schedules, phone calls or SMS. See{" "}
          <Link href="/how-it-works">how it works</Link>.
        </p>
      </FeatureSection>
    </FeaturePage>
  );
}
