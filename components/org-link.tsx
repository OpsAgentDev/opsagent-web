"use client";
import Link from "next/link";
import type { ComponentProps } from "react";
import { useOrgHref } from "@/lib/org";

/** A link to an in-app path (`/findings`), addressed inside the active organisation (`/o/<slug>/findings`). */
export function OrgLink({ href, ...rest }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  return <Link href={useOrgHref()(href)} {...rest} />;
}
