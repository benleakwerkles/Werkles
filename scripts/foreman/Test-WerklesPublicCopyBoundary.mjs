import fs from "node:fs/promises";
import path from "node:path";

const origin = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const routes = [
  "/",
  "/spark",
  "/space",
  "/formation",
  "/proof",
  "/bellows",
  "/bellows/intake",
  "/bellows/recommendations",
  "/discovery",
  "/archetypes",
  "/pricing",
  "/membership",
  "/login",
  "/signup"
];

const forbidden = [
  { label: "founder name", pattern: /\bBen\b/i },
  { label: "internal agent name", pattern: /\b(?:HeimerDinker|Lady Jessica|Speaker entry)\b/i },
  { label: "internal packet language", pattern: /\b(?:operator packet|packet ledger|packet path|receipt path)\b/i },
  { label: "internal rollout language", pattern: /\b(?:shadow until|public flip|test keys|push\/merge to main)\b/i },
  { label: "filesystem implementation path", pattern: /(?:[A-Z]:\\|\/var\/task\/|foreman\/receipts\/)/i }
];

function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

const results = [];
for (const route of routes) {
  const url = `${origin}${route}`;
  try {
    const response = await fetch(url, { redirect: "manual" });
    const html = await response.text();
    const text = visibleText(html);
    const matches = forbidden.filter(({ pattern }) => pattern.test(text)).map(({ label }) => label);
    results.push({ route, status: response.status, pass: response.status === 200 && matches.length === 0, matches });
  } catch (error) {
    results.push({ route, status: 0, pass: false, matches: [], error: error instanceof Error ? error.message : String(error) });
  }
}

const receipt = {
  schema: "werkles_public_copy_boundary_v1",
  created_at: new Date().toISOString(),
  origin,
  scope: "anonymous public allowlist only",
  pass: results.every((result) => result.pass),
  routes_checked: routes.length,
  results
};

const output = path.resolve("foreman/receipts/WERKLES_PUBLIC_COPY_REGRESSION_GUARD_20260712.json");
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");

console.log(`PUBLIC_COPY_GUARD=${receipt.pass ? "PASS" : "FAIL"}`);
console.log(`ROUTES=${routes.length}`);
for (const result of results) {
  console.log(`${result.pass ? "PASS" : "FAIL"} ${result.route} status=${result.status}${result.matches.length ? ` matches=${result.matches.join(",")}` : ""}${result.error ? ` error=${result.error}` : ""}`);
}
console.log(`RECEIPT=${output}`);
process.exitCode = receipt.pass ? 0 : 1;
