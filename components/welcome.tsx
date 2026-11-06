import { Logo } from "@/components/brand/Logo";
import { CreateOrg } from "@/components/create-org";

const STEPS = ["Create your organisation", "Connect a cloud account (optional)", "Get your first briefing"];

/** What a user with no organisation sees: a slim bar (no links that cannot work yet), the form, and the road ahead. */
export function Welcome({ email, onCreated }: { email: string; onCreated: () => void }) {
  return (
    <>
      <header className="app-bar bar">
        <div className="app-bar-inner welcome-bar">
          <Logo size={22} />
          <span className="account-email">{email}</span>
        </div>
      </header>
      <main className="welcome">
        <p className="eyebrow">Welcome to OpsAgent</p>
        <CreateOrg
          onCreated={onCreated}
          intro={<p>Your organisation owns your cloud connections, findings and billing.</p>}
        />
        <ol className="steps-strip" aria-label="What happens next">
          {STEPS.map((title, i) => (
            <li key={title} aria-current={i === 0 ? "step" : undefined}>
              <span className="n" aria-hidden="true">{i + 1}</span>
              {title}
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
