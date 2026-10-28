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
          <p className="cites">Sent to #ops right away</p>
        </div>
      </div>
    </figure>
  );
}
