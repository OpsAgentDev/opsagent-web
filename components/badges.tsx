/** Severity as a coloured pill; the word is always shown, so colour is never the only signal. */
export function Severity({ value }: { value: string }) {
  return <span className={`badge sev-${value}`}>{value}</span>;
}

/** Status chip for findings and connections (open, snoozed, accepted, connected, …). */
export function Status({ value }: { value: string }) {
  return <span className={`chip-status st-${value}`}>{value}</span>;
}
