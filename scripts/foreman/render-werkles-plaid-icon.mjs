#!/usr/bin/env node
/**
 * Render the canonical Werkles W mark at 1024×1024 PNG (transparent) for Plaid etc.
 * Matches components/foundry/brand-mark.tsx SVG fallback.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "foreman/plaid/werkles-plaid-app-icon-1024.png");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="werkles-w" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#3D16CA"/>
      <stop offset="45%" stop-color="#672EED"/>
      <stop offset="55%" stop-color="#18C5AE"/>
      <stop offset="100%" stop-color="#02917E"/>
    </linearGradient>
  </defs>
  <path fill="url(#werkles-w)" d="M6 10 L16 38 L24 22 L32 38 L42 10 L36 10 L24 30 L12 10 Z"/>
</svg>`;

const html = `<!doctype html>
<html>
  <head><meta charset="utf-8"/></head>
  <body style="margin:0;background:transparent;display:flex;align-items:center;justify-content:center;width:1024px;height:1024px;">
    ${svg}
  </body>
</html>`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({ path: OUT, omitBackground: true });
await browser.close();

const stat = fs.statSync(OUT);
console.log(
  JSON.stringify(
    {
      ok: true,
      path: path.relative(ROOT, OUT).replace(/\\/g, "/"),
      width: 1024,
      height: 1024,
      bytes: stat.size,
      under4mb: stat.size < 4 * 1024 * 1024
    },
    null,
    2
  )
);
