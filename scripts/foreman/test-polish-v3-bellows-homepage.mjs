/**
 * Lady Jessica polish-v3 regression proof for:
 * - F1: Bellows product icon belongs to the in-card heading.
 * - F2: Homepage headline has a 521-700px responsive bridge.
 *
 * Run: node scripts/foreman/test-polish-v3-bellows-homepage.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const bellows = readFileSync(path.join(root, "app/bellows/page.tsx"), "utf8");
const css = readFileSync(path.join(root, "app/globals.css"), "utf8");

assert.match(
  bellows,
  /className="product-heading"[\s\S]*icon="product-bellows"[\s\S]*className="product-heading__copy"/,
  "Bellows product icon must remain inside its heading group"
);

assert.match(
  css,
  /@media \(min-width: 521px\) and \(max-width: 700px\)[\s\S]*?\.hero\.hero--rewrite-v1 h1,[\s\S]*?\.hero h1[\s\S]*?max-width: 13ch;[\s\S]*?font-size: clamp\(2\.55rem, 8vw, 3\.4rem\);/,
  "Homepage must retain the responsive headline bridge from 521px through 700px"
);

const origin = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
for (const route of ["/", "/bellows"]) {
  const response = await fetch(`${origin}${route}`);
  assert.equal(response.status, 200, `${route} must load locally`);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "bellows_icon_nested_in_product_heading",
        "homepage_521_700_responsive_bridge",
        "homepage_local_200",
        "bellows_local_200"
      ]
    },
    null,
    2
  )
);
