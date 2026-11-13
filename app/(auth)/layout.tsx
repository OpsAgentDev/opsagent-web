import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { ThemeSwitch } from "@/components/theme-switch";
import "../(marketing)/marketing.css";
import "@/components/auth/auth.css";

// Sign-in pages stay bare: the marketing tokens and styles, but no site header or footer. Only a way home.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mkt auth-shell">
      <Link href="/" className="auth-back">← Back to home</Link>
      <div className="auth-brand"><Logo size={28} /></div>
      {children}
      <div className="auth-theme"><ThemeSwitch /></div>
    </div>
  );
}
