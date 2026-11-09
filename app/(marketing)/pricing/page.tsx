import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/marketing/landing-icons";
import { joinCta, SIGNUPS_OPEN } from "@/lib/signups";

export const metadata: Metadata = {
  title: "Pricing · OpsAgent",
  description: "Flat pricing per cloud account, whatever its size: Starter $99, Team $299, Scale $599 a month. 14-day free trial on Team.",
};

const PLANS = [
  { name: "Starter", price: "$99", members: "2", integrations: "1", aiCredits: "1,000" },
  { name: "Team", trial: true, price: "$299", members: "5", integrations: "Unlimited", aiCredits: "5,000" },
  { name: "Scale", price: "$599", members: "Unlimited", integrations: "Unlimited", aiCredits: "15,000" },
];

const FEATURES = [
  ["Members", "members"],
  ["Cloud accounts", "integrations"],
  ["AI credits per cloud account per month", "aiCredits"],
] as const;

export default function Pricing() {
  return (
    <main className="page">
      <h1>Pricing</h1>
      <p className="lead">
        Prices are flat per cloud account, whatever its size. 14-day free trial on Team: card required, one cloud account. AWS is the first supported provider.
      </p>
      <p className="trial-note">Trial: 1,000 AI credits, for one cloud account.</p>
      <ul className="plans">
        {PLANS.map((p) => (
          <li key={p.name} className={p.trial ? "plan-featured" : undefined}>
            {p.trial && <p className="plan-badge">14-day free trial</p>}
            <h2>{p.name}</h2>
            <p className="price">
              {p.price} <span>per cloud account per month</span>
            </p>
            <dl>
              {FEATURES.map(([label, key]) => (
                <div key={key}>
                  <dt>
                    <CheckIcon size={18} />
                    {label}
                  </dt>
                  <dd>{p[key]}</dd>
                </div>
              ))}
            </dl>
            <Link className="btn" href={joinCta().href}>
              {SIGNUPS_OPEN && !p.trial ? "Get started" : joinCta().label}
            </Link>
          </li>
        ))}
      </ul>
      <section>
        <h2>Questions</h2>
        <div className="faq">
          <div>
            <h3>What counts as a cloud account?</h3>
            <p>One connected account.</p>
          </div>
          <div>
            <h3>Do I have to connect a cloud account to sign up?</h3>
            <p>No. You can sign up and connect later. The trial covers one account.</p>
          </div>
          <div>
            <h3>What is an AI credit?</h3>
            <p>One US cent of model use, at list price, for Dashboard AI explanations and chat. Top-ups are 1,000 credits for $15. Your own model key never uses credits.</p>
          </div>
          <div>
            <h3>Can I cancel?</h3>
            <p>Yes. Your history stays readable for 30 days.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
