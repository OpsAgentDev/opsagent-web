"use client";
import { useRef, useState } from "react";
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

/** The top bar's organisation name: plain text with one organisation, a button that opens the list with more. */
export function OrgSwitcher({ orgs, current }: { orgs: OrgChoice[]; current: OrgChoice }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useDismiss(open, () => setOpen(false), root, button);

  const name = (
    <>
      <span className="avatar" aria-hidden="true">{initials(current.name)}</span>
      <span className="org-name">{current.name}</span>
    </>
  );
  if (orgs.length < 2) return <p className="org-switch">{name}</p>;

  return (
    <div className="org-switch" ref={root}>
      <button ref={button} type="button" className="org-button" aria-label={`Organisation: ${current.name}`} aria-expanded={open} aria-controls="org-list" onClick={() => setOpen(!open)}>
        {name}
        <span className="caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul id="org-list" className="org-list" aria-label="Organisations">
          {orgs.map((o) => (
            <li key={o.slug}>
              <button type="button" aria-current={o.slug === current.slug ? "true" : undefined} onClick={() => (o.slug === current.slug ? setOpen(false) : switchOrg(o.slug))}>
                {o.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
