#!/usr/bin/env node
"use strict";

function parseMatchingStorageMode(value) {
  const configured = (value ?? "file").trim().toLowerCase();
  if (configured === "file" || configured === "supabase") return configured;
  throw new Error(`Unsupported MATCHING_STORAGE_MODE: ${configured}`);
}

function matchingReceiptPath(mode) {
  return mode === "supabase"
    ? "supabase:public.matching_shadow_runs"
    : "data/matching/shadow-runs.jsonl";
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const cases = [
  { env: undefined, mode: "file", receipt: "data/matching/shadow-runs.jsonl" },
  { env: "file", mode: "file", receipt: "data/matching/shadow-runs.jsonl" },
  { env: "supabase", mode: "supabase", receipt: "supabase:public.matching_shadow_runs" }
];

for (const test of cases) {
  const mode = parseMatchingStorageMode(test.env);
  assert(mode === test.mode, `mode ${test.env} -> ${mode}, expected ${test.mode}`);
  const receipt = matchingReceiptPath(mode);
  assert(receipt === test.receipt, `receipt ${receipt} != ${test.receipt}`);
}

let rejected = false;
try {
  parseMatchingStorageMode("bogus");
} catch {
  rejected = true;
}
assert(rejected, "invalid mode should throw");

process.stdout.write(JSON.stringify({ ok: true, schema: "WERKLES_MATCHING_STORAGE_MODE_V1", checks: cases.length + 1 }) + "\n");
