import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const page = readFileSync(path.join(root, "app/bellows/library/page.tsx"), "utf8");
const data = readFileSync(path.join(root, "lib/bellows/operator-library.ts"), "utf8");
const bellowsHome = readFileSync(path.join(root, "app/bellows/page.tsx"), "utf8");

for (const required of [
  "Guru busting",
  "Company starter kit",
  "Proof Before Reliance",
  "Partnership Alignment"
]) {
  assert.match(`${page}\n${data}`.toLowerCase(), new RegExp(required.toLowerCase()), `missing ${required}`);
}

assert.match(bellowsHome, /href="\/bellows\/library"/);
assert.match(page, /Educational information and planning questions only/);
assert.match(page, /Do not sign or rely on this page/);
assert.match(data, /not a substitute/);
assert.match(data, /must never promise character, performance, safety, creditworthiness, or a successful deal/);
assert.doesNotMatch(`${page}\n${data}`, /\$\d|crypto|bitcoin|guaranteed results/i);

const origin = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
for (const route of ["/bellows", "/bellows/library"]) {
  const response = await fetch(`${origin}${route}`);
  assert.equal(response.status, 200, `${route} must load locally`);
}

console.log(JSON.stringify({
  pass: true,
  checks: [
    "four_curriculum_doors",
    "bellows_library_entry_link",
    "legal_and_proof_boundaries",
    "red_zone_and_price_absence",
    "bellows_routes_200"
  ]
}, null, 2));
