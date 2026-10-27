import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>OpsAgent is a product of Binary Labs LLC.</p>
      <p className="site-footer-links">
        <a href="mailto:info@opsagent.dev">info@opsagent.dev</a>
        <Link href="/docs/connect-your-agent">Connect your agent</Link>
      </p>
    </footer>
  );
}
