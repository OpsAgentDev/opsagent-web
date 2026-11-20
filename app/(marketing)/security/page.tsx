import type { Metadata } from "next";
import Link from "next/link";
import * as I from "@/components/marketing/landing-icons";

export const metadata: Metadata = {
  title: "Security · OpsAgent",
  description: "OpsAgent is read-only by design: a role you create, no write access, and no way to read object contents, database rows, secret values or log events.",
};

export default function Security() {
  return (
    <main className="page">
      <h1>Security</h1>
      <section className="sec-row">
        <span className="ico"><I.ShieldIcon /></span>
        <div>
          <h2>Read-only by design</h2>
          <p>
            You create the role yourself, from a template you can read before you create it. The role&apos;s trust
            requires an ExternalId that is unique to your connection.
          </p>
        </div>
      </section>
      <section className="sec-row">
        <span className="ico"><I.NoEyeIcon /></span>
        <div>
          <h2>What it reads, and what it can&apos;t</h2>
          <p>Watch scans read the same read-only data as the nightly scan, every 15 minutes, and never change anything.</p>
          <p>The role can read only what OpsAgent&apos;s checks use:</p>
          <ul className="bullets">
            <li>
              Compute and network: your instances, volumes, snapshots and who each disk snapshot you own is shared
              with, Elastic IP addresses, security groups and network interfaces, your load balancers, and the list
              of regions.
            </li>
            <li>Databases: database instances and clusters, their snapshots, and who each RDS instance snapshot and each Aurora cluster snapshot is shared with.</li>
            <li>
              Storage: bucket names, their regions, their public-access settings and whether a bucket&apos;s policy
              makes it public.
            </li>
            <li>
              Identity: the credential report (which users have a password, MFA and access keys, and when each was
              last used; never the passwords or keys themselves), the policies attached to users, and whether the
              roles your backups use are allowed to restore.
            </li>
            <li>
              Logging and threat detection: your CloudTrail trails and whether they are logging, whether GuardDuty is
              on, and log group names and settings.
            </li>
            <li>
              Backups and certificates: backup plans, what they cover, backup jobs and vaults; certificates and their
              expiry dates.
            </li>
            <li>
              Usage and cost: CloudWatch metrics (numbers only: CPU and request counts, and GPU use where the
              CloudWatch agent publishes it), the list of SageMaker training jobs, and your daily cost per service.
            </li>
            <li>
              Itself: the account ID, and its own role and policies, so OpsAgent can check the role still matches the
              template.
            </li>
          </ul>
          <p>
            Three reads are what the public-snapshot and idle-resource checks need. <code>ec2:DescribeSnapshotAttribute</code>{" "}
            and <code>rds:DescribeDBClusterSnapshotAttributes</code> return who a snapshot is shared with, not its contents.{" "}
            <code>cloudwatch:GetMetricData</code> returns metric numbers: 7-day CPU for your running instances, and
            request counts (or bytes, for network load balancers) for your load balancers. There is no read of logs.
          </p>
          <p>
            A connection made from an older role template keeps working and is not marked as missing anything. Its role
            lacks the two snapshot reads, so Aurora cluster snapshots and disk snapshots are not checked for public
            sharing until you update the stack with the current template. OpsAgent finds out by simulating the role&apos;s
            policy, not by making a request that would be refused.
          </p>
          <p>
            It cannot read object contents, database rows, secret or parameter values, log events or function code.
            The role does not grant any of these, and it explicitly denies reading objects, secrets, parameters, table
            items and function code. The role has no write permissions at all, so OpsAgent cannot change, stop or
            delete anything.
          </p>
          <p>
            One read is optional: Terraform state files. The template has a setting that lets the role read state
            files under one bucket and prefix you name. It is off unless you fill it in, and OpsAgent does not read
            state files today. State files can contain secrets, so name only the prefix you want checked.
          </p>
          <p>
            Each full scan (the nightly one, or one you start yourself) makes one AWS Cost Explorer request in your
            account, which AWS bills at about US$0.01. Watch scans make none. Each nightly scan also reads CloudWatch
            metrics, which AWS bills at about US$0.01 per 1,000 metrics: a fraction of a cent for a typical account.
          </p>
        </div>
      </section>
      <section className="sec-row">
        <span className="ico"><I.BackupIcon /></span>
        <div>
          <h2>Your data</h2>
          <p>
            OpsAgent stores inventory metadata, findings and the evidence behind them. It is stored on Amazon Web
            Services, in the United States (Oregon).
          </p>
          <p>
            OpsAgent&apos;s outbound requests, such as calls to your own AI endpoint, come from one fixed address,{" "}
            <code>32.185.67.24</code>, in case you allowlist by IP. Requests to Amazon S3 in the Oregon region travel
            inside AWS and do not use it.
          </p>
          <p>
            Secrets such as Slack tokens are encrypted with a per-organisation key, which is itself wrapped by a master
            key.
          </p>
        </div>
      </section>
      <section className="sec-row">
        <span className="ico"><I.GpuIcon /></span>
        <div>
          <h2>AI and your data</h2>
          <p>
            Dashboard AI is off until an owner turns it on. Only then does OpsAgent send the AI the findings and
            resources it looks up to answer you, which can include lists across your organisation. They go to
            Anthropic, to OpenAI as the backup provider, or to the AI provider or endpoint an owner configures.
            Anthropic does not train on this data.
          </p>
          <p>
            Agents you connect over MCP use their own model. MCP traffic never touches OpsAgent&apos;s model key.
          </p>
          <p>
            If you add your own key, it is encrypted with your organisation&apos;s key, and only its
            last 4 characters are ever shown again.
          </p>
        </div>
      </section>
      <section className="sec-row">
        <span className="ico"><I.ToggleIcon /></span>
        <div>
          <h2>You stay in control</h2>
          <p>Delete the role at any time. Disconnecting stops OpsAgent from using the role at once. Deleting the stack in your account removes the role entirely.</p>
        </div>
      </section>
      <section className="sec-row">
        <span className="ico"><I.FlagIcon /></span>
        <div>
          <h2>Reporting a security issue</h2>
          <p>
            Use the <Link href="/contact?topic=security">contact form</Link> and choose Security.
          </p>
        </div>
      </section>
    </main>
  );
}
