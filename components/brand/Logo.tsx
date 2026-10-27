export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="OpsAgent" xmlns="http://www.w3.org/2000/svg">
      <rect aria-hidden="true" width="40" height="40" rx="9" fill="#1f3a5f" />
      <path aria-hidden="true" d="M9 24 a11 11 0 0 1 22 0" fill="#fbbf24" />
      <rect aria-hidden="true" x="6" y="26" width="28" height="3" rx="1.5" fill="#fff" />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-label="OpsAgent"
      role="img"
      style={{ display: "inline-flex", alignItems: "center", gap: size * 0.32, color: "#1f3a5f", fontSize: size * 0.8, fontWeight: 650, letterSpacing: "-0.01em", lineHeight: 1 }}
    >
      <span aria-hidden="true" style={{ display: "inline-flex" }}>
        <Mark size={size} />
      </span>
      <span aria-hidden="true">OpsAgent</span>
    </span>
  );
}
