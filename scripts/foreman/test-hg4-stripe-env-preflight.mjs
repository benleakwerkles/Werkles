// HG-4 preflight proof — names only, never values.
// Verifies the Stripe env-var surface is exact and consistent across:
//   lib/stripe-manifest.ts, lib/stripe.ts, app/api/webhooks/stripe/route.ts,
//   lib/product-human-gates.ts, and the HG-4 Operator prep card.
// Also asserts no live secret material is sitting in scanned source.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(path.join(root, rel), "utf8");

const results = [];
let pass = true;
function check(name, fn) {
  try {
    fn();
    results.push(name);
  } catch (error) {
    pass = false;
    results.push(`${name} FAILED: ${error.message}`);
  }
}

const manifestSource = read("lib/stripe-manifest.ts");
const products = [...manifestSource.matchAll(
  /key:\s*"([^"]+)"[\s\S]*?mode:\s*"([^"]+)"[\s\S]*?envVar:\s*"([^"]+)"/g
)].map(([, key, mode, envVar]) => ({ key, mode, envVar }));

check("manifest_has_12_products", () => {
  assert.equal(products.length, 12);
});

check("manifest_keys_and_envvars_unique", () => {
  assert.equal(new Set(products.map((p) => p.key)).size, products.length);
  assert.equal(new Set(products.map((p) => p.envVar)).size, products.length);
});

check("manifest_modes_valid", () => {
  for (const p of products) {
    assert.ok(["subscription", "payment"].includes(p.mode), `${p.key} mode=${p.mode}`);
  }
});

check("manifest_envvar_naming_convention", () => {
  for (const p of products) {
    assert.match(p.envVar, /^STRIPE_[A-Z0-9_]+_PRICE_ID$/, p.envVar);
  }
});

check("stripe_client_requires_secret_key", () => {
  assert.match(read("lib/stripe.ts"), /requireEnv\("STRIPE_SECRET_KEY"\)/);
});

check("webhook_route_requires_webhook_secret", () => {
  assert.match(read("app/api/webhooks/stripe/route.ts"), /requireEnv\("STRIPE_WEBHOOK_SECRET"\)/);
});

check("dues_price_ids_wired_with_legacy_fallback", () => {
  const stripeLib = read("lib/stripe.ts");
  assert.match(stripeLib, /STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID/);
  assert.match(stripeLib, /STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID/);
  assert.match(stripeLib, /STRIPE_MONTHLY_PRICE_ID/);
  assert.match(stripeLib, /STRIPE_YEARLY_PRICE_ID/);
});

check("gate_map_consumes_manifest_envvars", () => {
  const gates = read("lib/product-human-gates.ts");
  assert.match(gates, /from "@\/lib\/stripe-manifest"/);
  assert.match(gates, /stripeManifest\.products\.map\(\(product\) => \(\{\s*\n?\s*name: product\.envVar/);
});

check("hg4_card_names_match_code", () => {
  const card = read("foreman/handoffs/outbox/TO_OPERATOR_HG4_LIVE_SECRET_ENTRY_PREP_20260724.md");
  const required = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID",
    "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID",
    "STRIPE_MONTHLY_PRICE_ID",
    "STRIPE_YEARLY_PRICE_ID"
  ];
  for (const name of required) {
    assert.ok(card.includes(name), `HG-4 card missing ${name}`);
  }
});

check("no_live_secret_values_in_scanned_source", () => {
  const scanDirs = ["lib", "app", "scripts/foreman", "foreman/handoffs/outbox"];
  const extensions = new Set([".ts", ".tsx", ".mjs", ".md", ".ps1", ".example"]);
  const livePatterns = [/sk_live_[A-Za-z0-9]{8,}/, /whsec_[A-Za-z0-9]{20,}/, /price_[A-Za-z0-9]{20,}/];
  const files = [".env.example"];
  const walk = (dir) => {
    for (const entry of readdirSync(path.join(root, dir))) {
      const rel = path.join(dir, entry);
      const full = path.join(root, rel);
      if (statSync(full).isDirectory()) {
        if (entry !== "node_modules" && entry !== ".next") walk(rel);
      } else if (extensions.has(path.extname(entry))) {
        files.push(rel);
      }
    }
  };
  for (const dir of scanDirs) walk(dir);
  for (const rel of files) {
    const contents = read(rel);
    for (const pattern of livePatterns) {
      assert.ok(!pattern.test(contents), `possible live secret material in ${rel} (${pattern})`);
    }
  }
});

console.log(JSON.stringify({ pass, checks: results, products: products.map((p) => p.envVar) }, null, 2));
process.exit(pass ? 0 : 1);
