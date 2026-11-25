import { bySeverity, MAX_INPUT_BYTES, type ToolFinding, type ToolResult } from "@/lib/tools/types";

// shortcut: mirrors brain connectors inventory/iam.rs credential_report_users and checks 02 and 13 (thresholds
// 30, 90 and 7 days). The AdministratorAccess rule is left out: it needs ListAttachedUserPolicies, which the CSV lacks.
const MS_PER_DAY = 86_400_000;

/** Whole days since the report date; null for "N/A", "no_information" and the like. */
function daysSince(ts: string | undefined, now: Date): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ts ?? "");
  if (!m) return null;
  const then = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((today - then) / MS_PER_DAY);
  return days < 0 ? null : days; // a date in the future is no information, as in brain
}

/** One CSV record; handles quoted fields and doubled quotes. */
function fields(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && quoted && line[i + 1] === '"') { cur += '"'; i++; }
    else if (c === '"') quoted = !quoted;
    else if (c === "," && !quoted) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const max = (a: number | null, b: number | null) => (a === null ? b : b === null ? a : Math.max(a, b));

export function analyseCredentialReport(text: string, now: Date = new Date()): ToolResult {
  if (text.length > MAX_INPUT_BYTES) return { ok: false, error: "That is too large to check here." };
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  const header = fields(lines[0] ?? "");
  if (!header.includes("user") || !header.includes("mfa_active")) {
    return { ok: false, error: "That does not look like an IAM credential report. Paste the CSV printed by the command above, with its header line." };
  }
  const findings: ToolFinding[] = [];
  for (const line of lines.slice(1)) {
    const row = fields(line);
    const col = (name: string) => row[header.indexOf(name)] ?? "";
    const user = col("user");
    if (!user) continue;
    const mfa = col("mfa_active") === "true";
    const keys = ["access_key_1", "access_key_2"].filter((k) => col(`${k}_active`) === "true");

    if (user === "<root_account>") {
      const consoleDays = daysSince(col("password_last_used"), now);
      const password = col("password_enabled") === "not_supported" ? null : col("password_enabled") === "true";
      if ((consoleDays !== null && consoleDays <= 30) || keys.length > 0) {
        findings.push({ severity: "critical", title: "Root account in use", detail: "The root user signed in within the last 30 days or has an active access key. No policy can limit root, so one leaked root credential is full control of the account. Delete its access keys and use an IAM role for daily work." });
      }
      if (!mfa && !(password === false && keys.length === 0)) {
        findings.push({ severity: "high", title: "Root account has no MFA", detail: "The root user can sign in with a password alone. Assign an MFA device to root." });
      }
      continue;
    }

    let age: number | null = null;
    let unusedAge: number | null = null;
    for (const k of keys) {
      const rotated = daysSince(col(`${k}_last_rotated`), now);
      const lastUsed = daysSince(col(`${k}_last_used_date`), now);
      if (lastUsed === null) unusedAge = max(unusedAge, rotated);
      age = max(age, rotated);
    }
    const consoleOn = col("password_enabled") === "true";
    const consoleDays = consoleOn ? (daysSince(col("password_last_used"), now) ?? daysSince(col("password_last_changed"), now)) : null;

    if (age !== null && age > 90) findings.push({ severity: "medium", title: `Access key of ${user} is over 90 days old`, detail: `An active access key was last rotated ${age} days ago. The older a key, the more places it may have leaked to. Create a new key, move the app to it, then delete the old one.` });
    if (consoleOn && !mfa) findings.push({ severity: "medium", title: `${user} has console access without MFA`, detail: "The user can sign in to the console with a password alone. Assign an MFA device." });
    if (unusedAge !== null && unusedAge >= 7) findings.push({ severity: "medium", title: `An active access key of ${user} was never used`, detail: `It has been active and never used for ${unusedAge} days. An unused key is a live credential nobody watches. Delete it.` });
    if (keys.length >= 2) findings.push({ severity: "low", title: `${user} has ${keys.length} active access keys`, detail: "Two live keys usually mean a rotation was never finished, doubling what can leak. Delete the one no longer used." });
    if (consoleOn && consoleDays !== null && consoleDays > 90) findings.push({ severity: "low", title: `Console password of ${user} unused for ${consoleDays} days`, detail: "A password nobody uses can still be guessed or phished. Remove the console password if the user does not sign in." });
  }
  const users = lines.slice(1).filter((l) => (fields(l)[header.indexOf("user")] ?? "") !== "" && !l.startsWith("<root_account>")).length;
  return { ok: true, checked: users, findings: findings.sort(bySeverity) };
}
