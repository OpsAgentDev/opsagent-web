import { bySeverity, MAX_INPUT_BYTES, type ToolFinding, type ToolResult } from "@/lib/tools/types";

// Mirrors brain check 14 (crates/checks/src/check_14_trust_policies.rs). tests/fixtures/trust-policy-cases.json is the
// same file as brain's; both must give the same variant and severity for every case. shortcut: federated principals,
// NotPrincipal and the customer's other accounts are not judged, as in brain; one finding per variant per role.
type Json = Record<string, unknown>;
type Role = { name: string; account: string | null; doc: Json };

const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const list = (v: unknown): unknown[] => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);

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

/** IAM wildcard match, case-insensitive: `*` is any run, `?` is one character. */
const glob = (pattern: string, text: string) =>
  new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".")}$`, "i").test(text);

/** `Action` patterns match sts:AssumeRole, or `NotAction` patterns do not. AssumeRoleWithWebIdentity and ...WithSAML are other actions. */
function allowsAssume(st: Json): boolean {
  const hit = (v: unknown) => list(v).some((a) => typeof a === "string" && glob(a, "sts:AssumeRole"));
  return st.NotAction !== undefined ? !hit(st.NotAction) : hit(st.Action);
}

/** A positive operator on sts:ExternalId with only non-empty literal values. ForAllValues is true when the key is absent, so it does not count. */
function hasExternalId(cond: unknown): boolean {
  if (!isObj(cond)) return false;
  return Object.entries(cond).some(([op, keys]) => {
    const o = op.toLowerCase().replace(/^foranyvalue:/, "");
    if (!["stringequals", "stringequalsignorecase", "stringlike"].includes(o) || !isObj(keys)) return false;
    return Object.entries(keys).some(([k, v]) => {
      const values = list(v);
      return k.toLowerCase() === "sts:externalid" && values.length > 0 && values.every((x) => typeof x === "string" && x !== "" && !/[*?]/.test(x));
    });
  });
}

/** A bare 12-digit account id, or the account of an arn:aws:iam::<id>: ARN. */
const accountOfPrincipal = (p: unknown): string | null => (typeof p === "string" ? (/^\d{12}$/.test(p) ? p : accountOf(p)) : null);

function checkRole({ name, account, doc }: Role): ToolFinding[] {
  let any = false;
  let anyConditional = false;
  const foreign = new Set<string>();
  for (const st of list(doc.Statement)) {
    if (!isObj(st) || st.Effect !== "Allow" || !allowsAssume(st)) continue;
    const principals = isObj(st.Principal) ? list(st.Principal.AWS) : list(st.Principal);
    const hasCondition = isObj(st.Condition) && Object.keys(st.Condition).length > 0;
    if (principals.includes("*")) {
      if (hasCondition) anyConditional = true;
      else any = true;
    } else if (!hasExternalId(st.Condition)) {
      for (const p of principals) {
        const a = accountOfPrincipal(p);
        if (a && a !== account) foreign.add(a);
      }
    }
  }
  const out: ToolFinding[] = [];
  if (any) out.push({ variant: "any_principal", severity: "critical", title: `${name} can be assumed by anyone in any AWS account`, detail: "The principal is * with no condition. Replace it with the exact accounts or roles that need it, or add a condition that limits who can assume the role." });
  if (anyConditional) out.push({ variant: "any_principal_conditional", severity: "medium", title: `${name} can be assumed by any AWS principal, limited only by a condition`, detail: "The principal is *. Only the Condition decides who can assume the role, so read it: it must name your own accounts or organisation." });
  if (foreign.size > 0) {
    const accounts = [...foreign].sort().join(", ");
    out.push({
      variant: "foreign_account_no_external_id",
      severity: "medium",
      title: `${name} trusts account ${accounts} with no sts:ExternalId condition`,
      detail: `If that account belongs to a vendor or another third party, anyone else who uses the same vendor can try to point their service at your role (the confused deputy problem). Add a Condition that makes the caller present a fixed sts:ExternalId, using the ID the vendor gave you. If the account is your own, you can leave it.${account === null ? " The pasted policy does not say which account owns the role, so every account in it is listed." : ""}`,
    });
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
