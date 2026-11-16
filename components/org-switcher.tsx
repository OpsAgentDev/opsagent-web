"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CreateOrg } from "@/components/create-org";
import { preferOrg } from "@/lib/members";
import { orgHref } from "@/lib/org-path";
import { useDismiss } from "@/lib/use-dismiss";

export type OrgChoice = { slug: string; name: string };

/** Two letters for the badge: the first letters of the first two words, else the first two letters. */
const initials = (name: string) => {
  const words = name.trim().split(/\s+/);
  return (words.length > 1 ? words[0]!.charAt(0) + words[1]!.charAt(0) : name.trim().slice(0, 2)).toUpperCase();
};

/** Choosing another organisation makes it the one the app opens, then reloads into it. */
function switchOrg(slug: string) {
  preferOrg(slug);
  window.location.assign(orgHref(slug, "/dashboard"));
}

/** A new organisation from the top bar: the onboarding form in a dialog; once made, the app switches to it. */
function CreateOrgDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => ref.current?.showModal(), []);
  return (
    <dialog ref={ref} onClose={onClose} aria-label="Create organisation">
      <CreateOrg onCreated={(o) => switchOrg(o.slug)} />
      <button type="button" className="quiet" onClick={() => ref.current?.close()}>Cancel</button>
    </dialog>
  );
}

/** The top bar's organisation name: a menu to switch organisation, open its settings or create another. */
export function OrgSwitcher({ orgs, current, plan }: { orgs: OrgChoice[]; current: OrgChoice; plan?: string | null }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useDismiss(open, () => setOpen(false), root, button);

  return (
    <div className="org-switch" ref={root}>
      <button ref={button} type="button" className="org-button" aria-label={`Organisation: ${current.name}`} aria-expanded={open} aria-controls="org-menu" onClick={() => setOpen(!open)}>
        <span className="avatar" aria-hidden="true">{initials(current.name)}</span>
        <span className="org-id">
          <span className="org-name">{current.name}</span>
          {plan && <span className="org-plan">{plan}</span>}
        </span>
        <span className="caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div id="org-menu" className="org-list">
          <ul aria-label="Organisations">
            {orgs.map((o) => (
              <li key={o.slug}>
                <button type="button" aria-current={o.slug === current.slug ? "true" : undefined} onClick={() => (o.slug === current.slug ? setOpen(false) : switchOrg(o.slug))}>
                  {o.name}
                </button>
              </li>
            ))}
          </ul>
          <hr />
          <Link href={orgHref(current.slug, "/settings/members")} onClick={() => setOpen(false)}>Organisation settings</Link>
          <button type="button" onClick={() => { setOpen(false); setCreating(true); }}>Create organisation</button>
        </div>
      )}
      {creating && <CreateOrgDialog onClose={() => setCreating(false)} />}
    </div>
  );
}
