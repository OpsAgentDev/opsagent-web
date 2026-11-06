"use client";

import { useEffect, useRef, useState } from "react";
import { countAt } from "@/lib/ease";
import { sharedRevealer } from "@/lib/reveal";

const DURATION = 1400;

/**
 * Counts from 0 to `to` once when it scrolls into view. Renders `to` on the server, without
 * JavaScript and under reduced motion.
 */
export function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(to);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const r = sharedRevealer();
    if (!el || !r || to === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setN(0);
    let raf = 0;
    const stop = r.watch(el, () => {
      const start = performance.now();
      const step = (now: number) => {
        setN(countAt(to, now - start, DURATION));
        if (now - start < DURATION) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    return () => {
      stop();
      cancelAnimationFrame(raf);
    };
  }, [to]);

  // Fixed width so the figure never reflows while it counts.
  return <span ref={ref} className="count" style={{ minWidth: `${String(to).length}ch` }}>{n}</span>;
}
