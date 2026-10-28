"use client";
import { ErrorNote } from "@/components/error-note";
import { Recipients } from "@/components/recipients";
import { SlackSettings } from "@/components/slack-settings";
import { UrgentAlerts } from "@/components/urgent-alerts";
import { api, unwrap } from "@/lib/api/client";
import { isOwner } from "@/lib/delivery";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

async function load(org: string) {
  const path = { params: { path: { org } } };
  const [integrations, connections, members] = await Promise.all([
    unwrap(api.GET("/orgs/{org}/integrations", path)),
    unwrap(api.GET("/orgs/{org}/connections", path)),
    unwrap(api.GET("/orgs/{org}/members", path)),
  ]);
  return { integrations, connections, members };
}

export default function DeliverySettings() {
  const org = useOrg();
  const { data, error, reload } = useApi(() => load(org.slug), [org.slug]);
  const slack = data?.integrations.find(
    (i) => i.kind === "slack" && i.status === "active",
  );
  const owner = isOwner(org.role);

  return (
    <main>
      <h1>Delivery</h1>
      {!owner && <p className="muted">An owner manages delivery.</p>}
      <ErrorNote error={error} />
      {!data ? (
        !error && (
          <p className="muted" role="status">
            Loading…
          </p>
        )
      ) : (
        <>
          <SlackSettings
            org={org.slug}
            owner={owner}
            active={!!slack}
            teamName={slack?.team_name}
            connections={data.connections}
            onChanged={reload}
          />
          <UrgentAlerts
            owner={owner}
            org={org.slug}
            connections={data.connections}
            onChanged={reload}
          />
          <Recipients
            owner={owner}
            org={org.slug}
            connections={data.connections}
            members={data.members}
          />
        </>
      )}
    </main>
  );
}
