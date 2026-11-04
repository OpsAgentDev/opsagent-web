import { Mark } from "@/components/brand/Logo";

/** CSS-drawn phone showing the urgent alert on a lock screen; the app is not out yet, so it is a sample. */
export function PhoneMockup() {
  return (
    <figure className="phone" aria-label="Sample lock-screen alert from the coming mobile app">
      <div className="phone-screen">
        <span className="phone-notch" aria-hidden="true" />
        <p className="phone-date">Tuesday</p>
        <p className="phone-time">03:12</p>
        <div className="phone-note">
          <div className="phone-note-head">
            <Mark size={20} />
            <span>OpsAgent</span>
            <span className="phone-note-when">now</span>
          </div>
          <p className="phone-note-title">Urgent alert</p>
          <p className="phone-note-body">
            Database <code>prod-db</code> snapshot left public
          </p>
        </div>
        <span className="phone-sample">Sample</span>
      </div>
    </figure>
  );
}
