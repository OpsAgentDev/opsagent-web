"use client";
import { useEffect, useState } from "react";
import { ErrorNote } from "@/components/error-note";
import { api, unwrap, type Connection } from "@/lib/api/client";
import { isSlackUrl, slackResult } from "@/lib/delivery";
import { useApi } from "@/lib/use-api";

type Props = {
  owner: boolean;
  org: string;
  teamName?: string | null;
  active: boolean;
  connections: Connection[];
  onChanged: () => void;
};

/** Slack connect and the per-connection channel picker. Brain holds the bot token; web never sees it. */
export function SlackSettings({
  owner,
  org,
  teamName,
  active,
  connections,
  onChanged,
}: Props) {
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<ReturnType<typeof slackResult>>(null);
  // Brain's OAuth callback lands here with ?slack=connected or ?slack=error&code=….
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setResult(slackResult(params));
    // Drop the callback params so a reload does not bring the banner back.
    if (params.has("slack") || params.has("code")) {
      params.delete("slack");
      params.delete("code");
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
      );
    }
  }, []);
  const channels = useApi(
    () =>
      active
        ? unwrap(
            api.GET("/orgs/{org}/integrations/slack/channels", {
              params: { path: { org } },
            }),
          )
        : Promise.resolve([]),
    [org, active],
  );

  async function connect() {
    try {
      const { authorize_url } = await unwrap(
        api.POST("/orgs/{org}/integrations/slack/start", {
          params: { path: { org } },
        }),
      );
      if (!isSlackUrl(authorize_url)) throw new Error("Unexpected Slack URL.");
      window.location.assign(authorize_url);
    } catch (err) {
      setError(err as Error);
    }
  }

  async function setChannel(id: string, slack_channel_id: string) {
    try {
      await unwrap(
        api.PATCH("/orgs/{org}/connections/{id}", {
          params: { path: { org, id } },
          body: { slack_channel_id },
        }),
      );
      setError(null);
      onChanged();
    } catch (err) {
      setError(err as Error);
    }
  }

  return (
    <section>
      <h2>Slack</h2>
      {result && (
        <p role="status" className={result.ok ? undefined : "error"}>
          {result.message}
        </p>
      )}
      <div className="row">
        <span>
          {!active
            ? "Not connected. Briefings go to owners by email."
            : `Connected to ${teamName ?? "Slack"}.`}
        </span>
        {owner && (
          <button type="button" onClick={connect}>
            {active ? "Reconnect Slack" : "Connect Slack"}
          </button>
        )}
      </div>
      <ErrorNote error={error ?? channels.error} />
      {active && (
        <table>
          <thead>
            <tr>
              <th>Connection</th>
              <th>Slack channel</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((c) => (
              <tr key={c.id}>
                <td>{c.display_name ?? c.id}</td>
                <td>
                  {owner ? (
                    <select
                      aria-label={`Slack channel for ${c.display_name ?? c.id}`}
                      value={c.slack_channel_id ?? ""}
                      onChange={(e) => setChannel(c.id, e.target.value)}
                    >
                      <option value="">Not set (email to owners)</option>
                      {channels.data?.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          #{ch.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    (channels.data?.find((ch) => ch.id === c.slack_channel_id)
                      ?.name ??
                    c.slack_channel_id ??
                    "Not set")
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
