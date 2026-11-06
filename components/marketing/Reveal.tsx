"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef, type ElementType } from "react";
import { sharedRevealer } from "@/lib/reveal";

type Props<T extends ElementType> = { as?: T } & ComponentPropsWithoutRef<T>;

/**
 * Marks its element `data-in` the first time it scrolls into view. Server HTML is the final state:
 * landing.css hides `.rv` content only under `html.js` and without reduced motion.
 */
export function Reveal<T extends ElementType = "div">({ as, className, ...rest }: Props<T>) {
  const ref = useRef<HTMLElement>(null);
  const Tag: ElementType = as ?? "div";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.setAttribute("data-in", "");
    const r = sharedRevealer();
    if (!r) return show();
    return r.watch(el, show);
  }, []);

  return <Tag ref={ref} className={className ? `reveal ${className}` : "reveal"} {...rest} />;
}
