/** One shared IntersectionObserver for every scroll reveal on a page; each element fires once. */

type Entry = { target: Element; isIntersecting: boolean };
type Observer = { observe(el: Element): void; unobserve(el: Element): void; disconnect(): void };

export function revealer(make: (cb: (entries: Entry[]) => void) => Observer) {
  const subs = new Map<Element, () => void>();
  let io: Observer | null = null;

  function unwatch(el: Element) {
    if (!subs.delete(el)) return;
    io?.unobserve(el);
    if (subs.size === 0) {
      io?.disconnect();
      io = null;
    }
  }

  return {
    /** Calls `onIn` the first time `el` scrolls into view; returns the cleanup for unmount. */
    watch(el: Element, onIn: () => void): () => void {
      io ??= make((entries) => {
        for (const e of entries) {
          const cb = e.isIntersecting ? subs.get(e.target) : undefined;
          if (cb) {
            unwatch(e.target);
            cb();
          }
        }
      });
      subs.set(el, onIn);
      io.observe(el);
      return () => unwatch(el);
    },
    size: () => subs.size,
  };
}

let shared: ReturnType<typeof revealer> | null = null;

/** The page-wide revealer; null where IntersectionObserver is missing (callers then show content at once). */
export function sharedRevealer() {
  if (typeof IntersectionObserver === "undefined") return null;
  shared ??= revealer((cb) => new IntersectionObserver(cb, { rootMargin: "0px 0px -12% 0px" }));
  return shared;
}
