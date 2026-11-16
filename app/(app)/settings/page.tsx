"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useOrgHref } from "@/lib/org";

/** `/settings` opens its first tab. */
export default function Settings() {
  const router = useRouter();
  const to = useOrgHref()("/settings/members");
  useEffect(() => router.replace(to), [router, to]);
  return <main className="muted">Loading…</main>;
}
