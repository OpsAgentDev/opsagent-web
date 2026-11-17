"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { useDashboardLink } from "@/lib/use-dashboard-link";
import "./status-page.css";

/** The full-page notice behind the 404 and the error screen: logo, a title, a line, and the ways out. The dashboard is offered only when signed in. */
export function StatusPage({ title, children, extra }: { title: string; children: ReactNode; extra?: ReactNode }) {
  const dashboard = useDashboardLink();
  return (
    <main className="status-page">
      <Logo size={28} />
      <h1>{title}</h1>
      <p>{children}</p>
      <div className="status-actions">
        {extra}
        {dashboard && <Link href={dashboard} className="status-btn primary">Go to your dashboard</Link>}
        <Link href="/" className={dashboard ? "status-btn" : "status-btn primary"}>Back to home</Link>
      </div>
    </main>
  );
}
