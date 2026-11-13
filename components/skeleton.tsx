import "./overview.css";

/** Loading, shown as quiet blocks with a slow shimmer; screen readers get the word instead. */
export function Skeleton({ rows = false, count = 3 }: { rows?: boolean; count?: number }) {
  return (
    <>
      <p className="sr-only" role="status">Loading…</p>
      <div className={rows ? "ov-skel rows" : "ov-skel"} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => <i key={i} />)}
      </div>
    </>
  );
}
