import { Mark } from "@/components/brand/Logo";

/** Static example of an urgent alert; invented, so it is labelled as a sample. */
export function AlertCard() {
  return (
    <figure className="briefing alert" aria-label="Sample alert">
      <div className="briefing-head">
        <Mark size={28} />
        <div>
          <p className="briefing-title">Urgent alert</p>
          <p className="briefing-meta">03:12</p>
        </div>
        <span className="briefing-sample">Sample alert</span>
      </div>
      <div className="alert-body">
        <span className="dot dot-bad" role="img" aria-label="Critical" />
        <div>
          <p className="finding">
            Database <code>prod-db</code> snapshot left public
          </p>
          <p className="cites">Cites the snapshot&apos;s restore permission, which is set to public.</p>
          <dl className="alert-evidence">
            <dt>Resource</dt>
            <dd>
              <code>prod-db</code> snapshot
            </dd>
            <dt>Check</dt>
            <dd>Public exposure</dd>
            <dt>Evidence</dt>
            <dd>Restore permission: public</dd>
          </dl>
          <p className="alert-sent">Sent to #ops right away · 03:12</p>
        </div>
      </div>
      <figcaption className="briefing-foot">Read-only. Nothing in your cloud was changed.</figcaption>
    </figure>
  );
}
