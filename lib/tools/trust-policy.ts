import { bySeverity, MAX_INPUT_BYTES, type ToolFinding, type ToolResult } from "@/lib/tools/types";

// shortcut: a web-only rule, with no brain check behind it (brain never reads role trust policies; that needs
// iam:ListRoles in the customer role). Two rules only: an any-principal Allow with no Condition, and an account
// principal with no sts:ExternalId. Revisit with brain if a check is ever added, and tie them with a shared fixture.
type Json = Record<string, unknown>;
type Role = { name: string; account: string | null; doc: Json };

const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const list = (v: unknown): unknown[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/** The policy as an object: the CLI prints it decoded, a console copy or an old SDK may hand back a URL-encoded string. */
function asDoc(v: unknown): Json | null {
  if (isObj(v)) return v;
  if (typeof v !== "string") return null;
  try {
    const d: unknown = JSON.parse(decodeURIComponent(v));
    return isObj(d) ? d : null;
  } catch {
    return null;
  }
}

const accountOf = (arn: unknown): string | null => (typeof arn === "string" ? (/^arn:aws[\w-]*:iam::(\d{12}):/.exec(arn)?.[1] ?? null) : null);

/** Roles from `get-role`, `list-roles` or a bare trust policy. */
function rolesOf(input: unknown): Role[] {
  if (!isObj(input)) return [];
  const one = (r: unknown): Role[] => {
    if (!isObj(r)) return [];
    const doc = asDoc(r.AssumeRolePolicyDocument);
    return doc ? [{ name: typeof r.RoleName === "string" ? r.RoleName : "this role", account: accountOf(r.Arn), doc }] : [];
  };
  if (Array.isArray(input.Roles)) return input.Roles.flatMap(one);
  if (input.Role) return one(input.Role);
  if (input.AssumeRolePolicyDocument) return one(input);
  return Array.isArray(input.Statement) || isObj(input.Statement) ? [{ name: "this role", account: null, doc: input }] : [];
}

const hasExternalId = (cond: unknown) => isObj(cond) && Object.values(cond).some((op) => isObj(op) && Object.keys(op).some((k) => k.toLowerCase() === "sts:externalid"));
const assumes = (action: unknown) => list(action).some((a) => typeof a === "string" && /^(\*|sts:\*|sts:assumerole)$/i.test(a));

function checkRole({ name, account, doc }: Role): ToolFinding[] {
  const out: ToolFinding[] = [];
  for (const st of list(doc.Statement)) {
    if (!isObj(st) || st.Effect !== "Allow" || !assumes(st.Action)) continue;
    const aws = isObj(st.Principal) ? list(st.Principal.AWS) : list(st.Principal);
    const hasCondition = isObj(st.Condition) && Object.keys(st.Condition).length > 0;
    if (aws.includes("*")) {
      out.push(hasCondition
        ? { severity: "medium", title: `${name} can be assumed by any AWS principal, limited only by a condition`, detail: "The principal is *. Only the Condition decides who can assume the role, so read it: it must name your own accounts or organisation." }
        : { severity: "critical", title: `${name} can be assumed by anyone in any AWS account`, detail: "The principal is * with no condition. Replace it with the exact accounts or roles that need it, or add a condition that limits who can assume the role." });
      continue;
    }
    const foreign = aws.flatMap((p) => { const a = typeof p === "string" ? (/^\d{12}$/.test(p) ? p : accountOf(p)) : null; return a && a !== account ? [a] : []; });
    if (foreign.length > 0 && !hasExternalId(st.Condition)) {
      out.push({
        severity: "medium",
        title: `${name} trusts account ${[...new Set(foreign)].join(", ")} with no sts:ExternalId condition`,
        detail: `If that account belongs to a vendor or another third party, anyone else who uses the same vendor can try to point their service at your role (the confused deputy problem). Add a Condition with sts:ExternalId, using the ID the vendor gave you. If the account is your own, you can leave it.${account === null ? " The pasted policy does not say which account owns the role, so every account in it is listed." : ""}`,
      });
    }
  }
  return out;
}

export function analyseTrustPolicy(text: string): ToolResult {
  if (text.length > MAX_INPUT_BYTES) return { ok: false, error: "That is too large to check here." };
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return { ok: false, error: "That is not JSON. Paste the output of the command above." };
  }
  const roles = rolesOf(input);
  if (roles.length === 0) return { ok: false, error: "That does not look like a role or a trust policy. Paste the JSON printed by aws iam get-role, or the trust policy itself." };
  return { ok: true, checked: roles.length, findings: roles.flatMap(checkRole).sort(bySeverity) };
}
