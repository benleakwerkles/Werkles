#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const matrixPath = process.argv[2] || "foreman/receipts/WERKLES_VPG29_FUNCTION_GATE_MATRIX_20260720.json";
const matrix = JSON.parse(readFileSync(path.resolve(process.cwd(), matrixPath), "utf8"));

assert.equal(matrix.schema, "werkles.function-gate-matrix/v1");
assert.equal(matrix.cycle_id, "WERKLES-FLOCK-20260720-184759-ET-BETSY-02");
assert.equal(matrix.legacy_label, "VPG29");
assert.equal(matrix.production.deployment_id, "dpl_BBBNaeGfjnZJXy3FbQVmVjePVgxo");
assert.equal(matrix.production.release_label, "VPG22");
assert.equal(matrix.production.target, "production");
assert.equal(matrix.production.ready_state, "READY");
assert.equal(matrix.production.output_count, 371);
assert.equal(matrix.production.changed_by_cycle, false);
assert.equal(matrix.preview.target, "preview");
assert.equal(matrix.preview.ready_state, "READY");
assert.match(matrix.preview.deployment_id, /^dpl_/);
assert.match(matrix.preview.source_sha, /^[0-9a-f]{40}$/);

const rows = matrix.rows;
assert.ok(Array.isArray(rows) && rows.length > 0);
const unique = new Set();
for (const row of rows) {
  assert.ok(["Production", "Preview"].includes(row.environment));
  assert.equal(row.deployment_id, row.environment === "Production" ? matrix.production.deployment_id : matrix.preview.deployment_id);
  assert.match(row.method, /^(GET|POST)$/);
  assert.match(row.path, /^\//);
  assert.equal(Number.isInteger(row.status), true);
  assert.ok(
    [
      "PUBLIC_WORKING",
      "PREVIEW_WORKING",
      "AUTH_REQUIRED",
      "PUBLICLY_CLOSED",
      "SAVE_CLOSED",
      "INTERNAL_ONLY",
      "NOT_DEPLOYED",
      "UNKNOWN"
    ].includes(row.capability_state)
  );
  const key = `${row.environment}:${row.method}:${row.path}`;
  assert.equal(unique.has(key), false, `duplicate matrix row: ${key}`);
  unique.add(key);

  if (row.capability_state === "PUBLICLY_CLOSED") {
    assert.equal(row.status, 503, `${key}: PUBLICLY_CLOSED requires HTTP 503`);
    assert.equal(row.envelope?.state, "Closed", `${key}: PUBLICLY_CLOSED requires the Closed envelope`);
    if (row.path.startsWith("/api/verification/")) {
      assert.equal(
        row.environment,
        "Preview",
        `${key}: current Production does not prove provider closure`
      );
      assert.equal(matrix.source_flags.preview.PUBLIC_TEST_PROVIDER_ACTIONS_OPEN, false);
    }
  }
  if (row.status === 401) {
    assert.notEqual(row.capability_state, "PUBLICLY_CLOSED", `${key}: 401 proves auth only, not closure`);
  }
  if (row.capability_state === "SAVE_CLOSED") {
    assert.equal(row.status, 403, `${key}: SAVE_CLOSED requires HTTP 403`);
    assert.equal(row.envelope?.state, "Blocked", `${key}: SAVE_CLOSED requires the Blocked envelope`);
  }
  if (row.environment === "Preview") {
    assert.notEqual(row.capability_state, "PUBLIC_WORKING", `${key}: protected Preview is not Production`);
  }
}

for (const providerPath of [
  "/api/verification/identity",
  "/api/verification/funds",
  "/api/verification/funds/exchange"
]) {
  const production = rows.find(
    (row) => row.environment === "Production" && row.method === "POST" && row.path === providerPath
  );
  const preview = rows.find(
    (row) => row.environment === "Preview" && row.method === "POST" && row.path === providerPath
  );
  assert.equal(production?.status, 401);
  assert.equal(production?.capability_state, "AUTH_REQUIRED");
  assert.equal(preview?.status, 503);
  assert.equal(preview?.capability_state, "PUBLICLY_CLOSED");
  assert.equal(preview?.envelope?.state, "Closed");
}

assert.equal(matrix.gates.production_promotion, "HUMAN_GATE");
assert.equal(matrix.gates.tier_b_durable_saving, "HUMAN_GATE");
assert.equal(matrix.gates.provider_or_llm_enablement, "HUMAN_GATE");
assert.equal(matrix.gates.sql_schema_rls_or_production_data_mutation, "HUMAN_GATE");
assert.equal(matrix.gates.live_stripe_payment_change, "HUMAN_GATE");

console.log(
  JSON.stringify(
    {
      pass: true,
      deployment_rows: rows.length,
      proof: "401 remains AUTH_REQUIRED; provider closure requires Preview 503/Closed plus false source flag"
    },
    null,
    2
  )
);
