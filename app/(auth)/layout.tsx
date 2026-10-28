import type { ReactNode } from "react";
import MarketingLayout from "../(marketing)/layout";
import "@/components/auth/auth.css";

// Sign-in pages wear the marketing frame: SiteHeader, footer and the dark marketing styles.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <MarketingLayout>{children}</MarketingLayout>;
}
