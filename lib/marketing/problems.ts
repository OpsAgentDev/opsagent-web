// Problem pages on /problems/<slug>. Rules: a sentence about AWS carries the AWS docs page it comes from, and the page
// date is when those pages were read. A sentence about OpsAgent comes from the brain check named in `check`, never from
// AWS. Do not claim leaked-key detection (OpsAgent sees old, unused and admin keys, not a key on GitHub).

export type Sourced = { text: string; sourceUrl: string };
export type Step = Sourced & { command?: string };

export type ProblemEntry = {
  slug: string;
  /** Page title and search-result title. */
  title: string;
  /** Meta description. */
  description: string;
  heading: string;
  lead: string;
  /** ISO date the AWS docs below were last read. */
  asOf: string;
  /** What AWS says that explains the problem. */
  facts: Sourced[];
  /** Check on your own account, with the command that prints what to look at. */
  find: { text: string; command: string; sourceUrl: string };
  /** The fix, in order. */
  steps: Step[];
  /** What OpsAgent flags, each line from the brain check named in `check`. */
  check: string;
  flags: string[];
  /** What OpsAgent cannot see or does not do for this problem. */
  cannot: string[];
  /** A free in-browser tool for the same problem, when there is one. */
  tool?: { href: string; label: string };
};

const IAM = "https://docs.aws.amazon.com/IAM/latest/UserGuide";
const CLI = "https://docs.aws.amazon.com/cli/latest/reference";
const ACM = "https://docs.aws.amazon.com/acm/latest/userguide";
const VPC = "https://docs.aws.amazon.com/vpc/latest/userguide";
const S3 = "https://docs.aws.amazon.com/AmazonS3/latest/userguide";
const BPA = `${S3}/access-control-block-public-access.html`;
const BACKUP = "https://docs.aws.amazon.com/aws-backup/latest/devguide";
const TRAIL = "https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events.html";
const COST = "https://docs.aws.amazon.com/cost-management/latest/userguide";
const GD = "https://docs.aws.amazon.com/guardduty/latest/ug";
const LOGS = "https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Working-with-log-groups-and-streams.html";

export const PROBLEMS: ProblemEntry[] = [
  {
    slug: "old-iam-access-keys",
    title: "Find old and unused IAM access keys in AWS · OpsAgent",
    description: "List the IAM access keys in your AWS account that are old or never used, and rotate them safely. A free checker runs in your browser.",
    heading: "Find old and forgotten IAM access keys in your AWS account",
    lead: "An access key nobody uses is still a live credential. This is how to list the old ones and replace them without breaking an app.",
    asOf: "2026-11-28",
    facts: [
      { text: "A user can have at most two access keys.", sourceUrl: `${IAM}/id_credentials_access-keys.html` },
      { text: "The credential report shows, per key, when it was created or last changed (access_key_1_last_rotated) and when it was last used (access_key_1_last_used_date).", sourceUrl: `${IAM}/id_credentials_getting-report.html` },
      { text: "You can generate a credential report as often as once every four hours, and it covers only the first two access keys per user.", sourceUrl: `${IAM}/id_credentials_getting-report.html` },
    ],
    find: {
      text: "Print the credential report, then look at each active key's last_rotated and last_used_date.",
      command: "aws iam generate-credential-report && aws iam get-credential-report --query Content --output text | base64 --decode",
      sourceUrl: `${IAM}/id_credentials_getting-report.html`,
    },
    steps: [
      { text: "Create a second key for the user.", command: "aws iam create-access-key --user-name USER", sourceUrl: `${CLI}/iam/create-access-key.html` },
      { text: "Update every application and tool to use the new key.", sourceUrl: `${IAM}/id-credentials-access-keys-update.html` },
      { text: "Check that the old key is no longer used.", command: "aws iam get-access-key-last-used --access-key-id OLD_KEY_ID", sourceUrl: `${CLI}/iam/get-access-key-last-used.html` },
      { text: "Make the old key inactive instead of deleting it. AWS recommends not deleting it straight away.", command: "aws iam update-access-key --access-key-id OLD_KEY_ID --status Inactive --user-name USER", sourceUrl: `${CLI}/iam/update-access-key.html` },
      { text: "After a waiting period with nothing broken, delete it.", command: "aws iam delete-access-key --access-key-id OLD_KEY_ID --user-name USER", sourceUrl: `${CLI}/iam/delete-access-key.html` },
    ],
    check: "checks 02 and 13",
    flags: [
      "Medium: an active access key last rotated over 90 days ago.",
      "Medium: an active access key that was never used, after 7 days.",
      "Low: a user with two active access keys at once.",
      "Medium: a console user without MFA. Low: a console password unused for over 90 days.",
      "Critical: the root user signed in within 30 days or has an access key. High: a user with AdministratorAccess attached.",
    ],
    cannot: [
      "It does not find a key that was pasted into GitHub or a chat. It sees old, unused and powerful keys in your account, not where a key has been copied.",
      "It never rotates, disables or deletes a key. It connects read-only; you run the commands above.",
    ],
    tool: { href: "/tools/iam-credential-report-check", label: "Check your credential report in the browser" },
  },
  {
    slug: "acm-certificate-expiring",
    title: "ACM certificate expiring or renewal failed · OpsAgent",
    description: "Why an AWS ACM certificate does not renew, how to check its status and fix the DNS record, and how to get warned days before it expires.",
    heading: "Your ACM certificate is expiring or its renewal failed",
    lead: "ACM renews its own certificates only while it can still validate your domain. Here is how to check one and what to fix.",
    asOf: "2026-11-28",
    facts: [
      { text: "ACM renews a certificate automatically, if you use DNS validation, as long as the certificate is in use and the CNAME validation record stays in place.", sourceUrl: `${ACM}/dns-validation.html` },
      { text: "Deleting the CNAME record stops automatic renewal.", sourceUrl: `${ACM}/dns-validation.html` },
      { text: "A certificate is eligible for managed renewal when it is associated with another AWS service such as Elastic Load Balancing or CloudFront. An imported certificate and an already expired one are not eligible.", sourceUrl: `${ACM}/managed-renewal.html` },
    ],
    find: {
      text: "List your certificates, then look at one: its expiry date, whether it is in use, and its renewal status.",
      command: "aws acm list-certificates && aws acm describe-certificate --certificate-arn CERTIFICATE_ARN",
      sourceUrl: `${CLI}/acm/describe-certificate.html`,
    },
    steps: [
      { text: "In the ACM console, open the certificate and copy the CNAME validation record it shows. Add it back to your DNS zone if someone removed it.", sourceUrl: `${ACM}/dns-validation.html` },
      { text: "If the certificate is not attached to a load balancer or distribution, attach it. ACM does not renew a certificate that is not in use.", sourceUrl: `${ACM}/dns-validation.html` },
      { text: "For an imported certificate, ACM does not renew it. Import the renewed certificate before the old one expires.", command: "aws acm import-certificate --certificate-arn CERTIFICATE_ARN --certificate fileb://cert.pem --private-key fileb://key.pem", sourceUrl: `${CLI}/acm/import-certificate.html` },
    ],
    check: "check 05",
    flags: [
      "Critical: a certificate that expires in under 7 days, or has already expired.",
      "High: a certificate whose managed renewal failed.",
      "High: a certificate that expires in under 30 days.",
      "Info: a certificate that no load balancer or distribution uses.",
    ],
    cannot: [
      "It reads certificates in ACM only, in the regions your connection can reach. A certificate outside ACM, such as one installed on a server, is not seen.",
      "It never renews or imports a certificate. It connects read-only; you make the change.",
    ],
  },
  {
    slug: "security-group-open-to-the-world",
    title: "Security group open to 0.0.0.0/0: find and fix · OpsAgent",
    description: "Find AWS security groups that open SSH, RDP or a database port to the whole internet, and close them. A free checker runs in your browser.",
    heading: "A security group is open to the whole internet",
    lead: "A rule open to 0.0.0.0/0 on SSH, RDP or a database port can be reached by anyone. This is how to list those rules and close them.",
    asOf: "2026-11-28",
    facts: [
      { text: "A new security group has no inbound rules, so no inbound traffic is allowed until you add rules. A source of 0.0.0.0/0 allows traffic from the internet.", sourceUrl: `${VPC}/security-group-rules.html` },
      { text: "AWS Systems Manager Session Manager provides secure node management without the need to open inbound ports.", sourceUrl: "https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html" },
    ],
    find: {
      text: "Print every security group as JSON, then look for 0.0.0.0/0 or ::/0 on port 22, 3389, 3306, 5432 or another admin or database port.",
      command: "aws ec2 describe-security-groups --output json",
      sourceUrl: "https://docs.aws.amazon.com/cli/latest/reference/ec2/describe-security-groups.html",
    },
    steps: [
      { text: "Remove the open rule. AWS recommends describing the group afterwards to check the rule is gone.", command: "aws ec2 revoke-security-group-ingress --group-id sg-XXXX --protocol tcp --port 22 --cidr 0.0.0.0/0", sourceUrl: `${CLI}/ec2/revoke-security-group-ingress.html` },
      { text: "If you still need access, add the rule back for your office or VPN range only. For SSH, Session Manager needs no inbound port at all.", sourceUrl: "https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html" },
    ],
    check: "check 03",
    flags: [
      "Critical: a group open to 0.0.0.0/0 or ::/0 on an admin or database port (22, 3389, 3306, 5432, 1433, 27017, 6379, 9200, 5601, 11211, 2375).",
      "Info: a group open to the world only on other ports, such as 80 and 443 for a public web server.",
      "It checks the 15-minute urgent set, so a newly opened port is flagged within about 15 minutes, not the next morning.",
    ],
    cannot: [
      "The free checker on this site does not know what a group is attached to. OpsAgent in your account does, and ranks a group on an instance or interface above one on nothing.",
      "It never edits a security group. It connects read-only; you run the command above.",
    ],
    tool: { href: "/tools/security-group-check", label: "Check your security groups in the browser" },
  },
  {
    slug: "public-s3-bucket",
    title: "Public S3 bucket: turn on block public access · OpsAgent",
    description: "Find S3 buckets that are public or have block public access off, and turn it on. Fix it with one command; nothing is read from your objects.",
    heading: "An S3 bucket is public, or could become public by mistake",
    lead: "Block public access is the switch that stops one wrong policy or ACL from exposing a bucket. This is how to check it and turn it on.",
    asOf: "2026-11-28",
    facts: [
      { text: "S3 Block Public Access has four settings: BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy and RestrictPublicBuckets. Each can be applied to an access point, a bucket or an entire AWS account.", sourceUrl: BPA },
      { text: "Block Public Access settings override the policies and permissions that would make a bucket public.", sourceUrl: BPA },
      { text: "Block public access settings don't alter existing policies or ACLs.", sourceUrl: BPA },
    ],
    find: {
      text: "List your buckets, then read the block public access setting of each one.",
      command: "aws s3api list-buckets --query 'Buckets[].Name' --output text\naws s3api get-public-access-block --bucket BUCKET",
      sourceUrl: `${CLI}/s3api/get-public-access-block.html`,
    },
    steps: [
      { text: "Turn all four settings on for the bucket, unless it is meant to be public.", command: "aws s3api put-public-access-block --bucket BUCKET --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true", sourceUrl: `${CLI}/s3api/put-public-access-block.html` },
      { text: "Read the bucket policy and remove any statement that grants access to everyone. Block public access does not change an existing policy.", command: "aws s3api get-bucket-policy --bucket BUCKET", sourceUrl: `${CLI}/s3api/get-bucket-policy.html` },
    ],
    check: "check 03",
    flags: [
      "High: a bucket whose policy allows public access while block public access is off.",
      "Medium: a bucket with block public access off, which one wrong policy or ACL would make public.",
      "Critical: a database with a public endpoint, or a public database or disk snapshot. These are in the 15-minute urgent set; buckets are checked in the nightly scan.",
    ],
    cannot: [
      "It never opens or lists your objects, so it cannot tell you what a public bucket holds. Its read role is denied data reads.",
      "It never changes a bucket setting. It connects read-only; you run the commands above.",
    ],
  },
  {
    slug: "missing-aws-backups",
    title: "No AWS backups or failing backups: find gaps · OpsAgent",
    description: "Find EC2, EBS and RDS resources with no backup plan, failed backup jobs or one day of retention, and what to change. Read-only check.",
    heading: "Your AWS resources have no working backup",
    lead: "A backup plan that never finishes a job leaves nothing to restore. This is how to find resources with no plan, failed jobs and thin retention.",
    asOf: "2026-11-28",
    facts: [
      { text: "AWS Backup can assign resources to a plan three ways: explicitly by resource type, all resources, or by tags to include or exclude.", sourceUrl: `${BACKUP}/assigning-resources.html` },
      { text: "For RDS, the backup retention period must be from 0 to 35 days, and setting it to 0 disables automated backups.", sourceUrl: `${CLI}/rds/modify-db-instance.html` },
      { text: "AWS Backup restore testing provides automated and periodic evaluation of restore viability.", sourceUrl: `${BACKUP}/restore-testing.html` },
    ],
    find: {
      text: "List what AWS Backup protects, any failed jobs, and the retention of each RDS database.",
      command: "aws backup list-protected-resources\naws backup list-backup-jobs --by-state FAILED\naws rds describe-db-instances --query 'DBInstances[].[DBInstanceIdentifier,BackupRetentionPeriod]'",
      sourceUrl: `${CLI}/backup/list-backup-jobs.html`,
    },
    steps: [
      { text: "Add each unprotected resource to a backup plan, by resource, by tag or all resources.", sourceUrl: `${BACKUP}/assigning-resources.html` },
      { text: "For a failed job, open it in the AWS Backup console to read the reason, fix it, then run an on-demand backup.", command: "aws backup list-backup-jobs --by-state FAILED", sourceUrl: `${CLI}/backup/list-backup-jobs.html` },
      { text: "Raise RDS retention above one day, for example to 7.", command: "aws rds modify-db-instance --db-instance-identifier DB_ID --backup-retention-period 7", sourceUrl: `${CLI}/rds/modify-db-instance.html` },
      { text: "Test a restore. Restore testing runs this on a schedule.", sourceUrl: `${BACKUP}/restore-testing.html` },
    ],
    check: "check 04",
    flags: [
      "Medium: an EC2 instance, EBS volume or RDS database in no backup plan. An RDS database with automated backups on is not flagged for this.",
      "Medium: a resource whose plan has had no finished backup job in 35 days. High: the last backup job failed.",
      "Medium: an RDS database that keeps backups for 1 day.",
      "High: a backup role that is denied the restore actions, checked by simulating them.",
    ],
    cannot: [
      "It does not run a restore, so it cannot prove a backup restores. It checks that the role is allowed to.",
      "It covers EC2 instances, EBS volumes and RDS databases only, and cannot inspect a vault in another account.",
      "It never creates a plan or a backup. It connects read-only; you make the changes.",
    ],
  },
  {
    slug: "cloudtrail-guardduty-off",
    title: "CloudTrail not logging or GuardDuty off · OpsAgent",
    description: "Check that an AWS CloudTrail trail is logging and GuardDuty is on in each region, and fix what is off. Read-only nightly check.",
    heading: "CloudTrail is not logging, or GuardDuty is switched off",
    lead: "Without a working trail there is no record of who changed what. Without GuardDuty, suspicious activity goes unseen. This is how to check both.",
    asOf: "2026-11-28",
    facts: [
      { text: "CloudTrail event history shows the past 90 days of management events in an AWS Region. For an ongoing record, create a trail or an event data store.", sourceUrl: TRAIL },
      { text: "GuardDuty identifies suspicious and potentially malicious activity in your AWS environment. It is a Regional service, and AWS recommends enabling it in all supported Regions.", sourceUrl: `${GD}/guardduty_settingup.html` },
      { text: "By default, log data is stored in CloudWatch Logs indefinitely. You can change the retention of each log group at any time.", sourceUrl: LOGS },
    ],
    find: {
      text: "List your trails and check each one is logging, then see which regions have a GuardDuty detector.",
      command: "aws cloudtrail describe-trails\naws cloudtrail get-trail-status --name TRAIL\naws guardduty list-detectors --region REGION",
      sourceUrl: `${CLI}/cloudtrail/get-trail-status.html`,
    },
    steps: [
      { text: "Start logging on the trail. Also check that its S3 bucket policy lets CloudTrail write to it.", command: "aws cloudtrail start-logging --name TRAIL", sourceUrl: `${CLI}/cloudtrail/start-logging.html` },
      { text: "Enable GuardDuty in each region you use. You can have one detector per account per region.", command: "aws guardduty create-detector --enable --region REGION", sourceUrl: `${CLI}/guardduty/create-detector.html` },
      { text: "Give log groups that never expire a retention period.", command: "aws logs put-retention-policy --log-group-name NAME --retention-in-days 90", sourceUrl: `${CLI}/logs/put-retention-policy.html` },
    ],
    check: "check 06",
    flags: [
      "Critical: no trail is both logging and able to write to its bucket.",
      "High: GuardDuty is off in one or more regions.",
      "Medium: it could not confirm any trail is logging, because the read role lacks cloudtrail:GetTrailStatus.",
      "Low: a log group that never expires, with its stored size and estimated monthly cost.",
    ],
    cannot: [
      "It does not read your logs or CloudTrail events, only whether logging and detection are on.",
      "It never starts a trail or enables GuardDuty. It connects read-only; you run the commands above.",
    ],
  },
  {
    slug: "surprise-aws-bill",
    title: "Surprise AWS bill: find the spike and idle spend · OpsAgent",
    description: "Find which AWS service jumped on your bill, and the volumes, IP addresses, load balancers and instances you pay for but do not use.",
    heading: "Your AWS bill jumped, or you pay for things you do not use",
    lead: "Most surprise bills are one new resource, or something left behind. This is how to find the day it changed and the idle spend under it.",
    asOf: "2026-11-28",
    facts: [
      { text: "Cost Explorer refreshes your cost data at least once every 24 hours.", sourceUrl: `${COST}/ce-what-is.html` },
      { text: "Any public IPv4 address that is not used on a resource is charged as idle, at $0.005 an hour at the time of reading.", sourceUrl: "https://aws.amazon.com/vpc/pricing/" },
      { text: "You are charged for each hour or partial hour that an Application Load Balancer is running.", sourceUrl: "https://aws.amazon.com/elasticloadbalancing/pricing/" },
      { text: "AWS Budgets lets you set spending limits and get alerts when costs approach or exceed them. AWS Cost Anomaly Detection uses machine learning to detect and alert on anomalous spend.", sourceUrl: `${COST}/budgets-managing-costs.html` },
    ],
    find: {
      text: "Print daily cost by service for a date range, then look for the day and the service that moved. Replace the dates.",
      command: "aws ce get-cost-and-usage --time-period Start=2026-11-01,End=2026-11-28 --granularity DAILY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE",
      sourceUrl: `${CLI}/ce/get-cost-and-usage.html`,
    },
    steps: [
      { text: "List volumes attached to nothing. They are billed every month. Snapshot one if the data matters, then delete it.", command: "aws ec2 describe-volumes --filters Name=status,Values=available\naws ec2 delete-volume --volume-id VOLUME_ID", sourceUrl: `${CLI}/ec2/delete-volume.html` },
      { text: "List Elastic IP addresses attached to nothing and release the ones you do not need.", command: "aws ec2 describe-addresses\naws ec2 release-address --allocation-id ALLOCATION_ID", sourceUrl: `${CLI}/ec2/release-address.html` },
      { text: "Confirm nothing routes to a load balancer with no traffic, then delete it.", command: "aws elbv2 delete-load-balancer --load-balancer-arn ARN", sourceUrl: `${CLI}/elbv2/delete-load-balancer.html` },
      { text: "Stop an instance that sits idle, or move it to a smaller type. A stopped instance still pays for its volumes.", command: "aws ec2 stop-instances --instance-ids INSTANCE_ID", sourceUrl: `${CLI}/ec2/stop-instances.html` },
      { text: "Set a budget alert or turn on Cost Anomaly Detection so the next jump reaches you the same day.", sourceUrl: `${COST}/manage-ad.html` },
    ],
    check: "check 01",
    flags: [
      "Medium: a day's spend more than 3 standard deviations above both its 7-day and 30-day baseline. High when it is also 20% and US$50 or more above the 30-day mean. The newest 2 days are left out because billing data lags.",
      "A volume attached to nothing, and an Elastic IP address attached to nothing, with the monthly cost when it is known. High from US$100 a month, Medium from US$20, Low below.",
      "An idle load balancer with no requests or traffic for a week, and an instance under 5% CPU for a week. These need the CloudWatch read access in the current OpsAgent read role.",
    ],
    cannot: [
      "It reads daily cost totals by service, not each resource or tag in depth. It names the service and the day, and you open Cost Explorer for the rest.",
      "It does not forecast your bill, and it does not advise on Savings Plans or reserved instances.",
      "Each full scan makes one Cost Explorer request in your account, which AWS bills at about US$0.01.",
      "It never deletes, stops or resizes anything. It connects read-only; you run the commands above.",
    ],
  },
];
