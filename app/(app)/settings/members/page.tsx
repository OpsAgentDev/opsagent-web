"use client";
import { ErrorNote } from "@/components/error-note";
import { Members } from "@/components/members";
import { api, unwrap } from "@/lib/api/client";
import { membersScopeNote } from "@/lib/members";
import { useOrg } from "@/lib/org";
import { useApi } from "@/lib/use-api";

export default function MembersPage() {
  const org = useOrg();
  const { data: me, error } = useApi(() => unwrap(api.GET("/auth/me")), []);
  const note = membersScopeNote(org.role);
  return (
    <main className="stack wide">
      <h1>Members</h1>
      {note && <p className="muted">{note}</p>}
      <ErrorNote error={error} showCode={false} />
      {me && <Members org={org.slug} owner={org.role === "owner"} selfId={me.id} />}
    </main>
  );
}
