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

/** Reloads the (app) layout's session (`me`, orgs), e.g. after a passkey is added or removed. */
export const SessionReloadContext = createContext<() => void>(() => {});

/** What the dashboard's setup checklist needs from the (app) layout, and how it tells the layout it is showing. */
type Setup = { hasPasskey: boolean; reloadSession: () => void; setChecklistOpen: (open: boolean | null) => void };
export const SetupContext = createContext<Setup>({ hasPasskey: true, reloadSession: () => {}, setChecklistOpen: () => {} });
export const useSetup = () => useContext(SetupContext);
