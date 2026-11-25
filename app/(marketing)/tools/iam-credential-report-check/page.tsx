import type { Metadata } from "next";
import { FeaturePage } from "@/components/marketing/FeaturePage";
import { CopyButton } from "@/components/marketing/CopyButton";
import { PasteTool } from "@/components/tools/PasteTool";

const COMMAND = "aws iam generate-credential-report && aws iam get-credential-report --query Content --output text | base64 --decode";

export const metadata: Metadata = {
  title: "IAM credential report checker: old keys and no MFA · OpsAgent",
  description:
    "Paste your AWS IAM credential report and see root use, missing MFA, access keys over 90 days old and keys never used. Runs in your browser. No sign-up.",
};

export default function IamCredentialReportCheck() {
  return (
    <FeaturePage slug="tool-iam-report" kicker="Free tool" title="Which IAM users and keys in your AWS account are overdue?" lead="Paste your IAM credential report. It runs in your browser. The report holds no key values, only dates and flags.">
      <div className="code-panel">
        <div className="code-panel-head">
          <span>Run this</span>
          <CopyButton text={COMMAND} label="Copy the command" />
        </div>
        <pre><code>{COMMAND}</code></pre>
      </div>
      <PasteTool tool="iam" />
      <p className="sample-note">
        Not covered here: users with AdministratorAccess attached, which needs a separate call. OpsAgent checks that every night.
        Dates are counted in whole days from today.
      </p>
    </FeaturePage>
  );
}
