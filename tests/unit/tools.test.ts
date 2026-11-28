import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyseCredentialReport } from "@/lib/tools/credential-report";
import { credentialExample, SG_EXAMPLE, TRUST_EXAMPLE } from "@/lib/tools/examples";
import { ADMIN_PORTS, analyseSecurityGroups } from "@/lib/tools/sg-exposure";
import { analyseTrustPolicy } from "@/lib/tools/trust-policy";

const sg = (perms: object[]) => JSON.stringify({ SecurityGroups: [{ GroupId: "sg-1", IpPermissions: perms }] });
const world = { IpRanges: [{ CidrIp: "0.0.0.0/0" }], Ipv6Ranges: [] };

describe("security group tool", () => {
  it("admin_ports_match_brain_fixture", () => {
    const fixture = JSON.parse(readFileSync("tests/fixtures/admin-ports.json", "utf8"));
    expect([...ADMIN_PORTS]).toEqual(fixture.adminPorts);
  });

  it("example_flags_ssh_postgres_and_all_ports", () => {
    const r = analyseSecurityGroups(SG_EXAMPLE);
    expect(r.ok && r.checked).toBe(3);
    const titles = r.ok ? r.findings.map((f) => f.title) : [];
    expect(titles.filter((t) => t.includes("exposes an admin or database port"))).toHaveLength(3);
    expect(r.ok && r.findings[0]?.detail).toMatch(/22|5432/);
    const all = r.ok && r.findings.find((f) => f.title.includes("debug-all"));
    expect(all && all.detail).toContain("22, 3389, 3306, 5432");
  });

  it.each([
    ["protocol -1 opens everything", [{ IpProtocol: "-1", ...world }], true],
    ["a range that contains 22", [{ IpProtocol: "tcp", FromPort: 20, ToPort: 30, ...world }], true],
    ["ipv6 only", [{ IpProtocol: "tcp", FromPort: 3389, ToPort: 3389, IpRanges: [], Ipv6Ranges: [{ CidrIpv6: "::/0" }] }], true],
    ["a missing port means all ports", [{ IpProtocol: "tcp", ...world }], true],
    ["https only", [{ IpProtocol: "tcp", FromPort: 443, ToPort: 443, ...world }], false],
    ["a range with no admin port", [{ IpProtocol: "tcp", FromPort: 8000, ToPort: 8100, ...world }], false],
    ["ssh from a private range", [{ IpProtocol: "tcp", FromPort: 22, ToPort: 22, IpRanges: [{ CidrIp: "10.0.0.0/8" }], Ipv6Ranges: [] }], false],
  ])("%s", (_n, perms, critical) => {
    const r = analyseSecurityGroups(sg(perms));
    expect(r.ok && r.findings.some((f) => f.severity === "critical")).toBe(critical);
  });

  it("rejects_bad_input", () => {
    expect(analyseSecurityGroups("not json")).toMatchObject({ ok: false });
    expect(analyseSecurityGroups("{}")).toMatchObject({ ok: false });
    expect(analyseSecurityGroups(" ".repeat(2_000_001))).toMatchObject({ ok: false });
  });

  it.each([
    '{"SecurityGroups":[null]}',
    '{"SecurityGroups":[{"IpPermissions":{}}]}',
    '{"SecurityGroups":[{"IpPermissions":[null]}]}',
    '{"SecurityGroups":[{"IpPermissions":[{"IpRanges":"0.0.0.0/0"}]}]}',
    '{"SecurityGroups":[{"IpPermissions":[{"IpRanges":[null]}]}]}',
  ])("odd_shapes_give_an_error_not_a_throw: %s", (input) => {
    expect(analyseSecurityGroups(input)).toMatchObject({ ok: false });
  });

  it("icmp_opens_no_port_and_titles_use_the_group_name", () => {
    expect(analyseSecurityGroups(sg([{ IpProtocol: "icmp", FromPort: -1, ToPort: -1, ...world }]))).toMatchObject({ ok: true, findings: [] });
    const named = JSON.stringify({ SecurityGroups: [{ GroupId: "sg-1", GroupName: "web", IpPermissions: [{ IpProtocol: "tcp", FromPort: 22, ToPort: 22, ...world }] }] });
    const r = analyseSecurityGroups(named);
    expect(r.ok && r.findings[0]?.title).toBe("Security group web exposes an admin or database port to the world");
  });

  it("accepts_a_bare_list_and_an_empty_one", () => {
    expect(analyseSecurityGroups("[]")).toEqual({ ok: true, checked: 0, findings: [] });
  });
});

describe("credential report tool", () => {
  const now = new Date("2026-11-25T12:00:00Z");
  const titles = (text: string) => {
    const r = analyseCredentialReport(text, now);
    return r.ok ? r.findings.map((f) => `${f.severity}:${f.title}`) : r;
  };

  it("example_findings_hold_on_any_day", () => {
    expect(titles(credentialExample(now))).toEqual([
      "critical:Root account in use",
      "high:Root account has no MFA",
      "medium:Access key of deploy-bot is over 90 days old",
      "medium:An active access key of deploy-bot was never used",
      "medium:Access key of j.contractor is over 90 days old",
      "medium:j.contractor has console access without MFA",
      "medium:An active access key of j.contractor was never used",
      "low:deploy-bot has 2 active access keys",
      "low:Console password of j.contractor unused for 300 days",
    ]);
  });

  it("a_clean_report_has_no_findings", () => {
    const csv = [
      "user,mfa_active,password_enabled,password_last_used,password_last_changed,access_key_1_active,access_key_1_last_rotated,access_key_1_last_used_date,access_key_2_active",
      "<root_account>,true,not_supported,N/A,not_supported,false,N/A,N/A,false",
      "ana,true,true,2026-11-20T00:00:00+00:00,2026-06-01T00:00:00+00:00,true,2026-10-01T00:00:00+00:00,2026-11-24T00:00:00+00:00,false",
    ].join("\n");
    expect(titles(csv)).toEqual([]);
  });

  it("a_new_unused_key_gets_a_week_of_grace", () => {
    const csv = "user,mfa_active,password_enabled,access_key_1_active,access_key_1_last_rotated,access_key_1_last_used_date\nbo,true,false,true,2026-11-20T00:00:00+00:00,N/A";
    expect(titles(csv)).toEqual([]);
  });

  it("root_without_credentials_needs_no_mfa", () => {
    const csv = "user,mfa_active,password_enabled,password_last_used,access_key_1_active\n<root_account>,false,false,N/A,false";
    expect(titles(csv)).toEqual([]);
  });

  it("root_with_no_password_info_and_no_mfa_is_reported", () => {
    const csv = "user,mfa_active,password_enabled,password_last_used,access_key_1_active\n<root_account>,false,not_supported,N/A,false";
    expect(titles(csv)).toEqual(["high:Root account has no MFA"]);
  });

  it("a_future_date_is_no_information", () => {
    const csv = "user,mfa_active,password_enabled,password_last_used,access_key_1_active\n<root_account>,true,true,2027-01-01T00:00:00+00:00,false";
    expect(titles(csv)).toEqual([]);
  });

  it("handles_quotes_crlf_and_a_bom_and_counts_users_only", () => {
    const csv = '\uFEFFuser,mfa_active,password_enabled,password_last_used,password_last_changed,access_key_1_active\r\n<root_account>,true,not_supported,N/A,not_supported,false\r\n"a,b",false,true,2026-11-20T00:00:00+00:00,2026-11-01T00:00:00+00:00,false\r\n';
    const r = analyseCredentialReport(csv, now);
    expect(r.ok && r.checked).toBe(1);
    expect(r.ok && r.findings.map((f) => f.title)).toEqual(["a,b has console access without MFA"]);
  });

  it("rejects_other_input", () => {
    expect(analyseCredentialReport("hello", now)).toMatchObject({ ok: false });
    expect(analyseCredentialReport("", now)).toMatchObject({ ok: false });
  });
});

describe("trust policy tool", () => {
  const stmt = (s: object) => ({ Effect: "Allow", Action: "sts:AssumeRole", ...s });
  const role = (s: object, arn = "arn:aws:iam::123456789012:role/r") => ({ RoleName: "r", Arn: arn, AssumeRolePolicyDocument: { Version: "2012-10-17", Statement: [stmt(s)] } });
  const run = (v: unknown) => analyseTrustPolicy(JSON.stringify(v));
  const titles = (r: ReturnType<typeof run>) => (r.ok ? r.findings.map((f) => f.severity + ": " + f.title) : []);

  it("example_flags_the_open_role_and_the_vendor_without_external_id_only", () => {
    const r = analyseTrustPolicy(TRUST_EXAMPLE);
    expect(r.ok && r.checked).toBe(4);
    const t = titles(r);
    expect(t).toHaveLength(2);
    expect(t[0]).toMatch(/^critical: legacy-open can be assumed by anyone/);
    expect(t[1]).toMatch(/^medium: vendor-monitoring trusts account 444455556666 with no sts:ExternalId/);
  });

  it.each([
    ["a bare * principal", { Principal: "*" }, "critical"],
    ["AWS: [*]", { Principal: { AWS: ["*"] } }, "critical"],
    ["a * principal behind a condition", { Principal: { AWS: "*" }, Condition: { StringEquals: { "aws:PrincipalOrgID": "o-1" } } }, "medium"],
    ["an account id with no external id", { Principal: { AWS: "444455556666" } }, "medium"],
    ["an account principal, array form", { Principal: { AWS: ["arn:aws:iam::444455556666:root"] } }, "medium"],
  ])("flags %s", (_n, s, sev) => {
    const r = run(role(s));
    expect(titles(r)).toHaveLength(1);
    expect(r.ok && r.findings[0]?.severity).toBe(sev);
  });

  it.each([
    ["the role's own account", { Principal: { AWS: "arn:aws:iam::123456789012:root" } }],
    ["an external id (any operator, any case)", { Principal: { AWS: "444455556666" }, Condition: { StringLike: { "STS:ExternalId": "x" } } }],
    ["a service principal", { Principal: { Service: "ec2.amazonaws.com" } }],
    ["a federated principal", { Principal: { Federated: "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" }, Action: "sts:AssumeRoleWithWebIdentity" }],
    ["a Deny statement", { Effect: "Deny", Principal: { AWS: "*" } }],
    ["an action that is not an assume", { Principal: { AWS: "*" }, Action: "s3:GetObject" }],
  ])("does not flag %s", (_n, s) => {
    expect(run(role(s)).ok && titles(run(role(s)))).toHaveLength(0);
  });

  it("reads get-role, a bare policy and a url-encoded document", () => {
    const open = { Principal: { AWS: "*" } };
    expect(titles(run({ Role: role(open) }))).toHaveLength(1);
    expect(titles(run({ Version: "2012-10-17", Statement: stmt(open) }))).toHaveLength(1);
    const enc = { ...role(open), AssumeRolePolicyDocument: encodeURIComponent(JSON.stringify(role(open).AssumeRolePolicyDocument)) };
    expect(titles(run({ Roles: [enc] }))).toHaveLength(1);
  });

  it("a bare policy cannot say which account is foreign, and says so", () => {
    const r = run({ Version: "2012-10-17", Statement: [stmt({ Principal: { AWS: "arn:aws:iam::123456789012:root" } })] });
    expect(r.ok && r.findings[0]?.detail).toContain("does not say which account owns the role");
  });

  it("rejects_other_input", () => {
    for (const bad of ["", "not json", "[]", "{}", JSON.stringify({ Roles: [] })]) expect(analyseTrustPolicy(bad).ok).toBe(false);
    expect(analyseTrustPolicy("x".repeat(2_000_001)).ok).toBe(false);
  });
});
