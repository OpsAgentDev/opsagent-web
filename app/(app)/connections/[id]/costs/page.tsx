"use client";
import { useParams } from "next/navigation";
import { ErrorNote } from "@/components/error-note";
import { OrgLink } from "@/components/org-link";
import { Skeleton } from "@/components/skeleton";
import { SpendChart } from "@/components/spend-chart";
import { FlaggedDays, Movers, ServiceTable } from "@/components/spend-tables";
import { api, unwrap, type CostSeries } from "@/lib/api/client";
import { dailyTotals, dayText, flaggedDays, movers, periods, serviceChanges, usd, WINDOW_DAYS } from "@/lib/cost";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

export default function Spend() {
  const org = useOrg();
  const { id } = useParams<{ id: string }>();
  const { data, error } = useApi(
    () => unwrap(api.GET("/orgs/{org}/connections/{id}/costs", { params: { path: { org: org.slug, id } } })),
    [org.slug, id],
  );

  return (
    <main>
      <h1>Spend</h1>
      <p className="muted"><OrgLink href={`/connections/${id}`}>Back to connection</OrgLink></p>
      <ErrorNote error={error} />
      {!data && !error && <Skeleton count={3} />}
      {data && (data.newest_day && data.days.length > 0 ? (
        <Loaded data={data} newest={data.newest_day} />
      ) : (
        <p data-testid="spend-empty">No spend data yet. It appears after a nightly scan once AWS Cost Explorer has data for the account.</p>
      ))}
    </main>
  );
}

function Loaded({ data, newest }: { data: CostSeries; newest: string }) {
  const totals = dailyTotals(data.days);
  const p = periods(data.days, newest);
  const changes = serviceChanges(data.days, newest);
  const short = Math.min(p.currentDays, p.previousDays) < WINDOW_DAYS;
  return (
    <>
      <p className="muted" data-testid="spend-note">Unblended cost per Cost Explorer, through {dayText(newest)}. The newest days can still change.</p>
      <p data-testid="spend-summary">
        Newest 30 days: <strong>{usd(p.currentTotal)}</strong>. Previous 30 days: <strong>{usd(p.previousTotal)}</strong>.
      </p>
      {short && (
        <p className="muted" data-testid="spend-short">
          Stored data covers {p.currentDays} of the newest 30 days and {p.previousDays} of the 30 before, so the changes below compare unequal periods.
        </p>
      )}
      <SpendChart totals={totals} />
      <ServiceTable rows={changes} />
      <Movers {...movers(changes)} />
      <FlaggedDays days={flaggedDays(data.flagged, totals)} />
    </>
  );
}
