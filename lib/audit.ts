// Plain-English labels for brain's audit action codes (Settings, Audit log).
export const ACTION_LABELS: Record<string, string> = {
  "org.create": "Created the organisation",
  "org.delete": "Deleted the organisation",
  "org.exported": "Exported the organisation's data",
  "invite.create": "Invited a member",
  "invite.accept": "Accepted an invite",
  "invite.revoke": "Revoked an invite",
  "member.role": "Changed a member's role",
  "member.remove": "Removed a member",
  "member.leave": "Left the organisation",
  "connection.create": "Added a cloud account",
  "connection.disconnect": "Disconnected a cloud account",
  "connection.reconnect_link": "Opened a reconnect link",
  "connection.verify_requested": "Asked for an access check",
  "connection.verify_outcome": "Checked access",
  "connection.scan_requested": "Asked for a scan",
  "connection.scan_started": "Started a scan",
  "finding.accepted": "Accepted a finding",
  "finding.snoozed": "Snoozed a finding",
  "finding.reopened": "Reopened a finding",
  "finding.report_explanation": "Reported an explanation",
  "recipient.create": "Added a recipient",
  "recipient.delete": "Removed a recipient",
  "recipient.confirm": "Recipient confirmed their address",
  "recipient.unsubscribe": "Recipient unsubscribed",
  "integration.slack_connect": "Connected Slack",
  "integration.delete": "Disconnected an integration",
  "oauth.consent.approved": "Approved an agent",
  "oauth.token.issued": "Connected an agent",
  "oauth.grant.revoked": "Revoked an agent",
  "mcp.tool.call": "Agent used a tool",
  "mcp.prompt.get": "Agent read a prompt",
  "mcp.resource.read": "Agent read a resource",
  "chat.tool.call": "Chat used a tool",
  "ai.enable": "Turned AI on",
  "ai.disable": "Turned AI off",
  "ai.key.set": "Saved a model key",
  "ai.key.delete": "Removed a model key",
  "ai.ceiling.set": "Changed the monthly AI limit",
  "ai.call": "Used AI",
  "billing.plan": "Changed the plan",
  "human_review.request": "Requested a human review",
};

/** The label for an action code; an unknown code is shown as it is. */
export const actionLabel = (code: string) => ACTION_LABELS[code] ?? code;

const TARGET_KINDS: Record<string, string> = {
  connection: "Cloud account", organisation: "Organisation", member: "Member", invite: "Invite", finding: "Finding",
  recipient: "Recipient", integration: "Integration", oauth_grant: "Agent", oauth_client: "Agent", model_key: "Model key",
};

/** The target by name where brain knows one, else its kind; nothing for an entry without a target. */
export function targetLabel(e: { target?: string | null; target_type?: string | null }): string {
  if (e.target) return e.target;
  return e.target_type ? (TARGET_KINDS[e.target_type] ?? e.target_type) : "";
}
