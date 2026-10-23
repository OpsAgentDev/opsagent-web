import type { Metadata } from "next";
import type { ReactNode } from "react";

// The page URL carries the confirm token; never leak it through Referer.
export const metadata: Metadata = { referrer: "no-referrer" };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
