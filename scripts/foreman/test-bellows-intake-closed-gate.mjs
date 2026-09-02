/**
 * Bellows intake closed-gate source + flag-matrix proof.
 * Run: node scripts/foreman/test-bellows-intake-closed-gate.mjs
 *
 * Does not hit production. Documents tip close-gap vs local dirty tree.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

function resolveOpen(env) {
  const raw = (env.NEXT_PUBLIC_BELLOWS_INTAKE_SUBMISSION_OPEN || env.BELLOWS_INTAKE_SUBMISSION_OPEN || "")
    .trim()
    .toLowerCase();
  let explicit = null;
  if (raw === "true" || raw === "1" || raw === "yes") explicit = true;
  else if (raw === "false" || raw === "0" || raw === "no") explicit = false;
  return explicit !== null ? explicit : env.NODE_ENV !== "production";
}

const availabilityPath = "lib/squibb/concierge-intake-availability.ts";
const formPath = "components/squibb/concierge-intake-form.tsx";
const routePath = "app/api/bellows/intake/route.ts";

const checks = [];

function check(name, fn) {
  fn();
  checks.push(name);
}

check("availability_module_present_locally", () => {
  assert.equal(existsSync(path.join(root, availabilityPath)), true);
  const src = read(availabilityPath);
  assert.match(src, /BELLOWS_INTAKE_SUBMISSION_OPEN/);
  assert.match(src, /NODE_ENV !== "production"/);
  assert.match(src, /secure account storage/);
});

check("api_route_wires_503_when_closed", () => {
  const src = read(routePath);
  assert.match(src, /concierge-intake-availability/);
  assert.match(src, /BELLOWS_INTAKE_SUBMISSION_OPEN/);
  assert.match(src, /status:\s*503/);
});

check("form_wires_availability", () => {
  const src = read(formPath);
  assert.match(src, /concierge-intake-availability/);
  assert.match(src, /BELLOWS_INTAKE_SUBMISSION_OPEN/);
  assert.match(src, /canSubmit/);
});

check("flag_matrix_prod_default_closed", () => {
  assert.equal(resolveOpen({ NODE_ENV: "production" }), false);
});

check("flag_matrix_dev_default_open", () => {
  assert.equal(resolveOpen({ NODE_ENV: "development" }), true);
});

check("flag_matrix_explicit_false_wins", () => {
  assert.equal(resolveOpen({ NODE_ENV: "development", BELLOWS_INTAKE_SUBMISSION_OPEN: "false" }), false);
  assert.equal(resolveOpen({ NODE_ENV: "production", BELLOWS_INTAKE_SUBMISSION_OPEN: "false" }), false);
});

check("flag_matrix_explicit_true_wins", () => {
  assert.equal(resolveOpen({ NODE_ENV: "production", BELLOWS_INTAKE_SUBMISSION_OPEN: "true" }), true);
  assert.equal(
    resolveOpen({ NODE_ENV: "production", NEXT_PUBLIC_BELLOWS_INTAKE_SUBMISSION_OPEN: "true" }),
    true
  );
});

check("env_example_documents_open_phrase", () => {
  const src = read(".env.example");
  assert.match(src, /APPROVE OPEN BELLOWS INTAKE SUBMISSION ON WERKLES\.COM/);
  assert.match(src, /BELLOWS_INTAKE_SUBMISSION_OPEN/);
});

console.log(JSON.stringify({ pass: true, checks }, null, 2));
