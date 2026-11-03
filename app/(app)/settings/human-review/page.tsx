"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ErrorNote } from "@/components/error-note";
import { HumanReviewView, ReviewNotice } from "@/components/human-review";
import { ReviewerProfile } from "@/components/reviewer-profile";
import { api, unwrap } from "@/lib/api/client";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

function HumanReviewPage() {
  const org = useOrg();
  const q = useSearchParams();
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
      <ReviewNotice paid={q.get("paid") === "1"} canceled={q.get("canceled") === "1"} />
      <ErrorNote error={error} />
      <ReviewerProfile />
      {data && (
        <HumanReviewView org={org.slug} owner={org.role === "owner"} data={data.reviews} connections={data.connections} onSent={reload} />
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <HumanReviewPage />
    </Suspense>
  );
}
