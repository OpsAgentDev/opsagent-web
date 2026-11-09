/** Build-time switch (NEXT_PUBLIC_SIGNUPS_OPEN=true): open sign-ups replace the waitlist everywhere on the marketing site. */
export const SIGNUPS_OPEN = process.env.NEXT_PUBLIC_SIGNUPS_OPEN === "true";

/** The one call to action every marketing page shows: the waitlist anchor, or the trial sign-up. */
export function joinCta(open: boolean = SIGNUPS_OPEN) {
  return open
    ? { label: "Start free trial", href: "/sign-up" }
    : { label: "Join the waitlist", href: "/#waitlist" };
}

/** The sentence under "Get your ops teammate." */
export function closingLine(open: boolean = SIGNUPS_OPEN) {
  return open
    ? "Start a 14-day free trial. Card required, cancel any time."
    : "The alpha opens to a few teams at a time. Join the waitlist and we will email you when your spot is ready.";
}
