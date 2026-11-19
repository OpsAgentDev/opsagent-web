import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/marketing/landing-icons";
import { PLAN_FEATURES as FEATURES, PLANS, PRICE_NOTE } from "@/lib/plans";
import { joinCta, SIGNUPS_OPEN } from "@/lib/signups";

export const metadata: Metadata = {
  title: "Pricing · OpsAgent",
  description: "Flat pricing per cloud account, whatever its size: Starter US$99, Team US$299, Scale US$599 a month, plus tax where applicable. 14-day free trial on Team.",
};

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
      <p className="trial-note">Every plan covers any number of cloud accounts; each connected account is billed at the plan&apos;s price.</p>
      <p className="trial-note">{PRICE_NOTE}</p>
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
            <p>
              Yes. After a cancel or an ended trial your data stays until you delete the organisation. A deleted organisation is erased from the
              live database after 30 days and leaves the nightly backups within 30 days more.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
