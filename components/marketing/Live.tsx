"use client";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Marks its box for the stylesheet, so a sample can play once when it is first seen and rest while nobody can see it:
 * `data-armed` at once, `data-seen` the first time it is in view, `data-paused` while off-screen or the tab is hidden.
 * Does nothing without IntersectionObserver or under reduced motion: the content is then simply there.
 */
export function Live({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.armed = "";
    let inView = false;
    const sync = () => {
      if (inView) el.dataset.seen = "";
      el.toggleAttribute("data-paused", !inView || document.hidden);
    };
    const io = new IntersectionObserver((entries) => {
      inView = entries.some((e) => e.isIntersecting);
      sync();
    }, { threshold: 0.3 });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return <div ref={ref} className={className ? `lp-live ${className}` : "lp-live"}>{children}</div>;
}
