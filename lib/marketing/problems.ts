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
];
