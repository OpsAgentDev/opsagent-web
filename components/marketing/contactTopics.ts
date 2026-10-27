// Separate from ContactForm because a server component cannot read values exported from a "use client" file.
export const TOPICS = [
  { value: "general", label: "General" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "security", label: "Security" },
  { value: "partnership", label: "Partnership" },
] as const;
export type Topic = (typeof TOPICS)[number]["value"];
