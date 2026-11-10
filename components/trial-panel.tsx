/** What starting a plan means, shown above the button. Copy matches the pricing page and docs/tech-spec/billing.md; keep them in step. */
export function TrialPanel({ available }: { available: boolean }) {
  if (!available) {
    return (
      <div className="card trial-panel">
        <h2>Start the Team plan</h2>
        <p>Your free trial has been used. Team is $299 a month per cloud account, charged today. Cancel any time.</p>
      </div>
    );
  }
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
