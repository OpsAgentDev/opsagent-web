export type Severity = "critical" | "high" | "medium" | "low" | "info";

/** One result row, shared by the free tools. Titles and severities mirror the brain check of the same name. */
export type ToolFinding = { severity: Severity; title: string; detail: string };

export type ToolResult =
  | { ok: true; checked: number; findings: ToolFinding[] }
  | { ok: false; error: string };

/** Pasted output larger than this is refused: the tools run in the page, so keep them quick. */
export const MAX_INPUT_BYTES = 2_000_000;

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

export const bySeverity = (a: ToolFinding, b: ToolFinding) =>
  SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
