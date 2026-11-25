export const SG_EXAMPLE = JSON.stringify(
  {
    SecurityGroups: [
      {
        GroupId: "sg-0a1b2c3d4e5f60718",
        GroupName: "web-prod",
        IpPermissions: [
          { IpProtocol: "tcp", FromPort: 443, ToPort: 443, IpRanges: [{ CidrIp: "0.0.0.0/0" }], Ipv6Ranges: [] },
          { IpProtocol: "tcp", FromPort: 22, ToPort: 22, IpRanges: [{ CidrIp: "0.0.0.0/0", Description: "temp ssh for deploy" }], Ipv6Ranges: [] },
        ],
      },
      {
        GroupId: "sg-0f9e8d7c6b5a40312",
        GroupName: "db-prod",
        IpPermissions: [{ IpProtocol: "tcp", FromPort: 5432, ToPort: 5432, IpRanges: [{ CidrIp: "0.0.0.0/0" }], Ipv6Ranges: [{ CidrIpv6: "::/0" }] }],
      },
      {
        GroupId: "sg-0c0ffee0000000001",
        GroupName: "debug-all",
        IpPermissions: [{ IpProtocol: "-1", IpRanges: [{ CidrIp: "0.0.0.0/0" }], Ipv6Ranges: [] }],
      },
    ],
  },
  null,
  2,
);

const HEADER =
  "user,arn,user_creation_time,password_enabled,password_last_used,password_last_changed,password_next_rotation,mfa_active,access_key_1_active,access_key_1_last_rotated,access_key_1_last_used_date,access_key_1_last_used_region,access_key_1_last_used_service,access_key_2_active,access_key_2_last_rotated,access_key_2_last_used_date,access_key_2_last_used_region,access_key_2_last_used_service,cert_1_active,cert_1_last_rotated,cert_2_active,cert_2_last_rotated";

/** An example report whose dates are relative to `now`, so the findings read the same on any day. */
export function credentialExample(now: Date = new Date()): string {
  const ago = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString().replace(/\.\d+Z$/, "+00:00");
  return [
    HEADER,
    `<root_account>,arn:aws:iam::123456789012:root,${ago(1700)},not_supported,${ago(12)},not_supported,not_supported,false,true,${ago(1700)},${ago(30)},us-east-1,s3,false,N/A,N/A,N/A,N/A,false,N/A,false,N/A`,
    `deploy-bot,arn:aws:iam::123456789012:user/deploy-bot,${ago(1500)},false,N/A,N/A,N/A,false,true,${ago(1500)},${ago(1)},us-west-2,ecs,true,${ago(400)},N/A,N/A,N/A,false,N/A,false,N/A`,
    `j.contractor,arn:aws:iam::123456789012:user/j.contractor,${ago(1000)},true,${ago(300)},${ago(1000)},N/A,false,true,${ago(1000)},N/A,N/A,N/A,false,N/A,N/A,N/A,N/A,false,N/A,false,N/A`,
  ].join("\n");
}
