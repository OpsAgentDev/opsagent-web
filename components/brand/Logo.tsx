export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="OpsAgent" xmlns="http://www.w3.org/2000/svg">
      <rect aria-hidden="true" width="40" height="40" rx="9" fill="#162036" />
      <circle aria-hidden="true" cx="20" cy="20" r="10.5" fill="none" stroke="#fff" strokeWidth="3.2" />
      <circle aria-hidden="true" cx="28.4" cy="12.6" r="4.2" fill="#22d3ee" stroke="#162036" strokeWidth="2" />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-label="OpsAgent"
      role="img"
      style={{ display: "inline-flex", alignItems: "center", gap: size * 0.32, fontSize: size * 0.8, fontWeight: 650, letterSpacing: "-0.01em", lineHeight: 1 }}
    >
      <span aria-hidden="true" style={{ display: "inline-flex" }}>
        <Mark size={size} />
      </span>
      <span aria-hidden="true">OpsAgent</span>
    </span>
  );
}
