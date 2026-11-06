/** Easing for the landing page's count-up figures: fast start, gentle landing. */
export function easeOutCubic(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - (1 - c) ** 3;
}

/** The whole number shown `elapsed` ms into a count from 0 to `target`; exactly `target` once done. */
export function countAt(target: number, elapsed: number, duration: number): number {
  return Math.round(target * easeOutCubic(elapsed / duration));
}
