import type { Metadata } from "next";
import { FeaturePage } from "@/components/marketing/FeaturePage";
import { CopyButton } from "@/components/marketing/CopyButton";
import { PasteTool } from "@/components/tools/PasteTool";

const COMMAND = "aws ec2 describe-security-groups --region us-east-1 --output json";

export const metadata: Metadata = {
  title: "AWS security group checker: ports open to the world · OpsAgent",
  description:
    "Paste the output of aws ec2 describe-security-groups and see which groups leave SSH, RDP or a database port open to 0.0.0.0/0. Runs in your browser. No sign-up.",
};

export default function SecurityGroupCheck() {
  return (
    <FeaturePage slug="tool-security-groups" kicker="Free tool" title="Which of your security groups are open to the whole internet?" lead="Paste the output of aws ec2 describe-security-groups. It runs in your browser. Nothing is uploaded, and there is no sign-up.">
      <div className="code-panel">
        <div className="code-panel-head">
          <span>Run this, once per region</span>
          <CopyButton text={COMMAND} label="Copy the command" />
        </div>
        <pre><code>{COMMAND}</code></pre>
      </div>
      <PasteTool tool="sg" />
      <p className="sample-note">
        This page reads rules only. It cannot tell whether a group is attached to a server, so it cannot tell you which
        of these are urgent. OpsAgent reads that too. Ports 22, 3389, 3306, 5432, 1433, 27017, 6379, 9200, 5601, 11211
        and 2375 count as admin or database ports, the same list its nightly and 15-minute checks use.
      </p>
    </FeaturePage>
  );
}
