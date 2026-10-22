// Filter values shared by the findings and dashboard pages (the contract types them as plain strings).
export const STATUSES = ["open", "snoozed", "accepted", "flapping", "resolved"] as const;
export const SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;
