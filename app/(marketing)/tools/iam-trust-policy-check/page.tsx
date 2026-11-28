import type { Metadata } from "next";
import { FeaturePage } from "@/components/marketing/FeaturePage";
import { CopyButton } from "@/components/marketing/CopyButton";
import { PasteTool } from "@/components/tools/PasteTool";

const COMMAND = "aws iam list-roles --output json";

export const metadata: Metadata = {
  title: "IAM role trust policy checker: open roles · OpsAgent",
  description:
    "Paste your AWS IAM roles and see which can be assumed by anyone, or trust another account with no ExternalId. Runs in your browser. No sign-up.",
};

export default function TrustPolicyCheck() {
  return (
    <FeaturePage slug="tool-trust-policy" kicker="Free tool" title="Which of your IAM roles can the wrong account assume?" lead="Paste the output of aws iam list-roles or aws iam get-role. It runs in your browser. Nothing is uploaded, and there is no sign-up.">
      <div className="code-panel">
        <div className="code-panel-head">
          <span>Run this</span>
          <CopyButton text={COMMAND} label="Copy the command" />
        </div>
        <pre><code>{COMMAND}</code></pre>
      </div>
      <PasteTool tool="trust" />
      <p className="sample-note">
        Two rules only. A role that anyone in any AWS account can assume (the principal is *, with no condition), and a role that trusts
        another account without an <code>sts:ExternalId</code> condition. AWS says an external ID is optional: it matters when the other
        account belongs to a vendor or another third party, and not when it is your own. You can paste one role from{" "}
        <code>aws iam get-role</code> or a bare trust policy too, but then the page cannot tell which account owns the role.
        An ExternalId only counts when a StringEquals, StringEqualsIgnoreCase or StringLike condition (or ForAnyValue: of those) names a fixed value: Null, Not operators, wildcards and ForAllValues do not enforce one. It does not read what a role is allowed to do, only who can assume it. OpsAgent does not check trust policies yet.
      </p>
      <p className="sample-note">
        AWS on the{" "}
        <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-user_externalid.html" rel="noopener noreferrer" target="_blank">external ID</a>{" "}
        and on{" "}
        <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html" rel="noopener noreferrer" target="_blank">the Principal element</a>
        . To change a trust policy, run <code>aws iam update-assume-role-policy</code>.
      </p>
    </FeaturePage>
  );
}
