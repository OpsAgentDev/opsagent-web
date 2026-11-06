/** What the free trial is, shown above "Start free trial". Copy matches the pricing page and docs/tech-spec/billing.md; keep them in step. */
export function TrialPanel() {
  return (
    <div className="card trial-panel">
      <h2>14-day free trial on the Team plan</h2>
      <p>
        Card required, and no charge until day 14. Team is $299 a month per cloud account; cancel any time before the
        trial ends and you pay nothing. The trial covers one cloud account.
      </p>
    </div>
  );
}
