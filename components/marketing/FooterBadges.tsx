/* Directory badges. Markup is verbatim from each directory (their crawlers match it), so do not alter href, src, rel or alt. */
/* eslint-disable @next/next/no-img-element */
export function FooterBadges() {
  return (
    <div className="site-footer-badges">
      <a href="https://themicrosaasdir.com/product/opsagent?ref=badge" rel="dofollow">
        <img src="https://themicrosaasdir.com/badge/opsagent.svg" alt="Featured on TheMicroSaaSDir" width="182" height="46" />
      </a>
      <a href="https://artificin.com" target="_blank">
        <img src="https://artificin.com/badges/Artificin-badge.png" alt="Featured on Artificin" />
      </a>
      <a href="https://publishyoursaas.com" target="_blank" rel="noopener" data-publishyoursaas-badge="manual-submission">
        <img src="https://publishyoursaas.com/publishyoursaas-badge.svg" alt="Listed on PublishYourSaaS" width="240" height="60" />
      </a>
      <a href="https://showmebest.ai" target="_blank">
        <img src="https://showmebest.ai/badge/feature-badge-white.webp" alt="Featured on ShowMeBestAI" width="220" height="60" />
      </a>
      <a href="https://braginpublic.com/?utm_source=badge&utm_medium=referral" target="_blank" rel="noopener">
        <img src="https://braginpublic.com/badge?theme=light" alt="Featured on Brag in Public" width="208" height="54" />
      </a>
      {/* Toolsify's exact text, typo included. */}
      <a href="https://toolsify.ai/" title="Toolsify AI Tools Directory">Toolsify AI Tools Diresctory</a>
    </div>
  );
}
