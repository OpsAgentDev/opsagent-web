import type { ReactNode } from "react";
import { SignupCta } from "@/components/marketing/SignupCta";
import { closingLine } from "@/lib/signups";
import type { CostIcon } from "@/components/marketing/landing-icons";

/** Frame shared by the /features pages: title and summary, the sections, and the closing call to action. */
export function FeaturePage({ slug, title, lead, children }: { slug: string; title: string; lead: string; children: ReactNode }) {
  return (
    <main className="page feature">
      <p className="feature-kicker">Features</p>
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
      {children}
      <section className="feature-cta" aria-labelledby="feature-cta-h">
        <h2 id="feature-cta-h">Get your ops teammate.</h2>
        <p>{closingLine()}</p>
        <SignupCta source={`feature-${slug}`} />
      </section>
    </main>
  );
}

/** One section: an icon tile beside a heading and its body, like the Security page rows. */
export function FeatureSection({ Icon, title, children }: { Icon: typeof CostIcon; title: string; children: ReactNode }) {
  return (
    <section className="sec-row">
      <span className="ico"><Icon /></span>
      <div>
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}
