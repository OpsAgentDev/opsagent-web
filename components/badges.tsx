/** API text inside a class name: letters, digits, `_` and `-` only, so it can add no other class. */
export function classToken(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "");
}

/** Severity as a coloured pill; the word is always shown, so colour is never the only signal. */
export function Severity({ value }: { value: string }) {
  return <span className={`badge sev-${classToken(value)}`}>{value}</span>;
}

/** Status chip for findings and connections (open, snoozed, accepted, connected, …). */
export function Status({ value, label }: { value: string; label?: string }) {
  return <span className={`chip-status st-${classToken(value)}`}>{label ?? value}</span>;
}
