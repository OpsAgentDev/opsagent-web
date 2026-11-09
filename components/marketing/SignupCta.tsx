import Link from "next/link";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { joinCta, SIGNUPS_OPEN } from "@/lib/signups";

/** The hero and closing call to action: the waitlist form, or a trial link once sign-ups are open. */
export function SignupCta({ source }: { source: React.ComponentProps<typeof WaitlistForm>["source"] }) {
  if (!SIGNUPS_OPEN) return <WaitlistForm source={source} />;
  const { label, href } = joinCta();
  return <Link href={href} className="trial-cta">{label}</Link>;
}
