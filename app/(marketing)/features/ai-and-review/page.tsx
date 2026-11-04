import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FeaturePage, FeatureSection } from "@/components/marketing/FeaturePage";
import * as I from "@/components/marketing/landing-icons";
import { FACTS, HEADLINE, SPECIALISMS } from "@/components/reviewer-profile";

export const metadata: Metadata = {
  title: "Dashboard AI and human review · OpsAgent",
  description: "Dashboard AI explains findings and answers questions once an owner turns it on. Or have Harun R. Rayhan review a finding ($99) or an account ($499).",
};

const CREDITS: [string, string][] = [
  ["Starter", "1,000"],
  ["Team", "5,000"],
  ["Scale", "15,000"],
];

const REVIEWS = [
  { name: "Finding review", price: "$99", body: "Harun reviews one finding and its evidence, and sends a written fix plan for your setup." },
  { name: "Account review", price: "$499", body: "Harun reviews one whole connected account, and sends a prioritised written report." },
];

export default function AiAndReview() {
  return (
    <FeaturePage
      slug="ai-and-review"
      title="Dashboard AI and human review"
      lead="Ask about your findings in plain words, right in the dashboard. When you want a person to look, request a human review."
    >
      <section aria-labelledby="ai-h" className="feature-part">
        <h2 id="ai-h">Dashboard AI</h2>
        <p>Explanations and chat on top of the same findings. The checks and alerts stay deterministic; the AI only explains.</p>
      </section>
      <FeatureSection Icon={I.ToggleIcon} title="Off until an owner turns it on">
        <p>
          Nothing reaches a model until an owner turns Dashboard AI on. Then every member can get a plain-language
          explanation of any finding, and chat about the account&apos;s findings, resources, scans and costs.
        </p>
        <p>Answers come only from OpsAgent&apos;s read-only data, and cite the check or the resource they rely on.</p>
      </FeatureSection>
      <FeatureSection Icon={I.KeyIcon} title="OpsAgent's key, or your own">
        <p>
          It runs on OpsAgent&apos;s key, or on your own Anthropic, OpenAI or compatible key. Your own key is encrypted,
          only its last 4 characters are ever shown again, and it never uses credits.
        </p>
      </FeatureSection>
      <FeatureSection Icon={I.CostIcon} title="AI credits">
        <p>One credit is one US cent of model use, at list price. Every plan includes credits each month.</p>
        <dl className="credit-table">
          {CREDITS.map(([plan, credits]) => (
            <div key={plan}><dt>{plan}</dt><dd>{credits}</dd></div>
          ))}
        </dl>
        <p>
          Top-ups are 1,000 credits for $15. See <Link href="/pricing">pricing</Link>.
        </p>
      </FeatureSection>

      <section aria-labelledby="review-h" className="feature-part">
        <h2 id="review-h">Human review</h2>
        <p>A one-off review by a person, requested and paid in the dashboard. Nothing is changed in your account.</p>
      </section>
      <div className="reviewer">
        <Image src="/reviewer/harun.jpg" alt="Harun R. Rayhan" width={88} height={88} className="reviewer-photo" />
        <div>
          <h3>Harun R. Rayhan</h3>
          <p>{HEADLINE}</p>
          <ul className="reviewer-chips" aria-label="About Harun">
            {FACTS.map((f) => <li key={f} className="strong">{f}</li>)}
            {SPECIALISMS.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
      </div>
      <ul className="review-cards">
        {REVIEWS.map((r) => (
          <li key={r.name}>
            <h3>{r.name}</h3>
            <p className="review-price">{r.price}</p>
            <p>{r.body}</p>
          </li>
        ))}
      </ul>
      <p className="muted">
        Owners request a review under Settings, Human review, or from any finding.
      </p>
    </FeaturePage>
  );
}
