import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { HUMAN_REVIEW } from "@/lib/human-review";

/** Hidden for launch: with the switch off this address is the not-found page. */
export default function HumanReviewLayout({ children }: { children: ReactNode }) {
  if (!HUMAN_REVIEW) notFound();
  return children;
}
