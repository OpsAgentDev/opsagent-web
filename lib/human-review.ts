/** True for the two "on" spellings of the switch; anything else, or nothing, is off. */
export const humanReviewOn = (value?: string) => value === "true" || value === "1";

/** Build-time switch (NEXT_PUBLIC_HUMAN_REVIEW=true): human review is hidden everywhere unless it is on. Default off. */
export const HUMAN_REVIEW = humanReviewOn(process.env.NEXT_PUBLIC_HUMAN_REVIEW);

/** The name of /features/ai-and-review: page title, nav label and metadata. */
export const aiPageTitle = (on: boolean = HUMAN_REVIEW) => (on ? "Dashboard AI and human review" : "Dashboard AI");
