import { bySeverity, MAX_INPUT_BYTES, type ToolFinding, type ToolResult } from "@/lib/tools/types";

// shortcut: mirrors brain crates/checks check_03_exposure.rs ADMIN_PORTS and connectors ec2.rs open_world_ports
// (protocol ignored, a missing port means all ports); keep in step through tests/fixtures/admin-ports.json.
export const ADMIN_PORTS = [22, 3389, 3306, 5432, 1433, 27017, 6379, 9200, 5601, 11211, 2375] as const;

type Permission = {
  IpProtocol?: string;
  FromPort?: number;
  ToPort?: number;
  IpRanges?: { CidrIp?: string }[];
  Ipv6Ranges?: { CidrIpv6?: string }[];
};
type Group = { GroupId?: string; GroupName?: string; IpPermissions?: Permission[] };

const isWorld = (p: Permission) =>
  (p.IpRanges ?? []).some((r) => r.CidrIp === "0.0.0.0/0") || (p.Ipv6Ranges ?? []).some((r) => r.CidrIpv6 === "::/0");

const clamp = (n: number) => Math.min(65535, Math.max(0, n));

/** The inclusive port range a rule opens; all ports for protocol -1. */
const portRange = (p: Permission): [number, number] =>
  p.IpProtocol === "-1" ? [0, 65535] : [clamp(p.FromPort ?? 0), clamp(p.ToPort ?? 65535)];

const label = ([from, to]: [number, number]) => (from === 0 && to === 65535 ? "all ports" : from === to ? `${from}` : `${from}-${to}`);

export function analyseSecurityGroups(text: string): ToolResult {
  if (text.length > MAX_INPUT_BYTES) return { ok: false, error: "That is too large to check here. Paste one region at a time." };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "That is not valid JSON. Paste the output of: aws ec2 describe-security-groups --output json" };
  }
  const groups = Array.isArray(data) ? data : (data as { SecurityGroups?: unknown })?.SecurityGroups;
  if (!Array.isArray(groups)) return { ok: false, error: 'Expected a "SecurityGroups" list, as printed by aws ec2 describe-security-groups.' };

  const findings: ToolFinding[] = [];
  for (const g of groups as Group[]) {
    const id = g.GroupId ?? "(no id)";
    const name = g.GroupName ? ` (${g.GroupName})` : "";
    const open = (g.IpPermissions ?? []).filter(isWorld).map(portRange);
    const admin = ADMIN_PORTS.filter((port) => open.some(([from, to]) => from <= port && port <= to));
    if (admin.length > 0) {
      findings.push({
        severity: "critical",
        title: `Security group ${id}${name} exposes an admin or database port to the world`,
        detail: `Open to 0.0.0.0/0 or ::/0 on ${admin.join(", ")}. SSH, RDP and database ports open to the world are scanned and brute-forced within minutes. Replace the open range with your office or VPN range (aws ec2 revoke-security-group-ingress removes a rule).`,
      });
    } else if (open.length > 0) {
      findings.push({
        severity: "info",
        title: `Security group ${id}${name} is open to the world on ${open.map(label).join(", ")}`,
        detail: "No admin or database port is open. Ports 80 and 443 open to the world are normal for a public web server.",
      });
    }
  }
  return { ok: true, checked: groups.length, findings: findings.sort(bySeverity) };
}
