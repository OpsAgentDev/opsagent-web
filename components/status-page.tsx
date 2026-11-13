import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import "./status-page.css";

/** The full-page notice behind the 404 and the error screen: logo, a title, a line, and the ways out. */
export function StatusPage({ title, children, extra }: { title: string; children: ReactNode; extra?: ReactNode }) {
  return (
    <main className="status-page">
      <Logo size={28} />
      <h1>{title}</h1>
      <p>{children}</p>
      <div className="status-actions">
        {extra}
        <Link href="/dashboard" className="status-btn primary">Go to your dashboard</Link>
        <Link href="/" className="status-btn">Back to home</Link>
      </div>
    </main>
  );
}
