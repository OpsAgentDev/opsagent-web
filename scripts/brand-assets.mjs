// Regenerates app/apple-icon.png and app/opengraph-image.png: node scripts/brand-assets.mjs
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const mark = (s) =>
  readFileSync(new URL("../app/icon.svg", import.meta.url), "utf8").replace('width="40" height="40"', `width="${s}" height="${s}"`);
const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const apple = `<body style="margin:0;background:#1f3a5f">${mark(180)}</body>`;
const og = `<body style="margin:0;width:1200px;height:630px;background:#f7f7f5;font-family:${font};box-sizing:border-box;padding:80px;display:flex;flex-direction:column;justify-content:space-between">
<div style="display:flex;align-items:center;gap:20px;color:#1f3a5f;font-size:48px;font-weight:650;letter-spacing:-0.01em">${mark(64)}OpsAgent</div>
<div style="color:#111;font-size:84px;font-weight:650;letter-spacing:-0.02em;line-height:1.05;max-width:900px">Your cloud, checked every night.</div></body>`;

const browser = await chromium.launch();
for (const [html, w, h, out] of [
  [apple, 180, 180, "app/apple-icon.png"],
  [og, 1200, 630, "app/opengraph-image.png"],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(html);
  await page.screenshot({ path: new URL(`../${out}`, import.meta.url).pathname });
  await page.close();
}
await browser.close();
