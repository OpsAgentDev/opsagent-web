"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { preferredOrg } from "@/lib/members";
import { orgHref } from "@/lib/org-path";

// One session check per page load, shared by the header and the page's calls to action.
let signedIn: Promise<boolean> | undefined;

/** The dashboard's address once `/auth/me` says this visitor is signed in; null before that, when signed out, or on error. */
export function useDashboardLink(): string | null {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    signedIn ??= api.GET("/auth/me").then(({ response }) => response.ok, () => false);
    signedIn.then((ok) => {
      if (!live || !ok) return;
      const org = preferredOrg();
      setHref(org ? orgHref(org, "/dashboard") : "/dashboard");
    });
    return () => { live = false; };
  }, []);
  return href;
}
