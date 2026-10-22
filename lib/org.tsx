"use client";
import { createContext, useContext } from "react";
import type { Org } from "./api/client";

export const OrgContext = createContext<Org | null>(null);

/** The active organisation; only valid inside the (app) layout. */
export function useOrg(): Org {
  const org = useContext(OrgContext);
  if (!org) throw new Error("useOrg outside the (app) layout");
  return org;
}
