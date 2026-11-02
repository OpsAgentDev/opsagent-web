"use client";
import { ErrorNote } from "@/components/error-note";
import { HumanReviewView } from "@/components/human-review";
import { ReviewerProfile } from "@/components/reviewer-profile";
import { api, unwrap } from "@/lib/api/client";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

export default function Page() {
  const org = useOrg();
  const path = { params: { path: { org: org.slug } } };
  const { data, error, reload } = useApi(
    async () => {
      const [reviews, connections] = await Promise.all([
        unwrap(api.GET("/orgs/{org}/human-reviews", path)),
        unwrap(api.GET("/orgs/{org}/connections", path)),
      ]);
      return { reviews, connections: connections.filter((c) => c.status !== "disconnected") };
    },
    [org.slug],
  );
  return (
    <main className="stack wide">
      <h1>Human review</h1>
      <ErrorNote error={error} />
      <ReviewerProfile />
      {data && (
        <HumanReviewView org={org.slug} owner={org.role === "owner"} data={data.reviews} connections={data.connections} onSent={reload} />
      )}
    </main>
  );
}
