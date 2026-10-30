import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing · OpsAgent",
  description: "Flat pricing per cloud account: Starter $99, Team $299, Scale $599 a month.",
};

const PLANS = [
  { name: "Starter", price: "$99", members: "2", integrations: "1" },
  { name: "Team", price: "$299", members: "5", integrations: "Unlimited" },
  { name: "Scale", price: "$599", members: "Unlimited", integrations: "Unlimited" },
];

export default function Pricing() {
  return (
    <main className="page">
      <h1>Pricing</h1>
      <p className="lead">
        14-day free trial on Team. Card required. Prices are flat per cloud account, whatever its size.
      </p>
      <ul className="plans">
        {PLANS.map((p) => (
          <li key={p.name}>
            <h2>{p.name}</h2>
            <p className="price">
              {p.price} <span>per cloud account per month</span>
            </p>
            <dl>
              <dt>Members</dt>
              <dd>{p.members}</dd>
              <dt>Integrations</dt>
              <dd>{p.integrations}</dd>
            </dl>
            <Link className="btn" href="/#waitlist">
              Join the waitlist
            </Link>
          </li>
        ))}
      </ul>
      <section>
        <h2>Questions</h2>
        <h3>What counts as a cloud account?</h3>
        <p>One connected account.</p>
        <h3>How is Dashboard AI billed?</h3>
        <p>Dashboard AI explanations and chat run on your own Anthropic or OpenAI key, so the provider bills you for model use directly. OpsAgent adds no AI charge.</p>
        <h3>Can I cancel?</h3>
        <p>Yes. Your history stays readable for 30 days.</p>
      </section>
    </main>
  );
}
