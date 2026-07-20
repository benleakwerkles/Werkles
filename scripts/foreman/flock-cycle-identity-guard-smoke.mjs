#!/usr/bin/env node

import assert from "node:assert/strict";

import { evaluateFlockCycleIdentity } from "./flock-cycle-identity-guard.mjs";

const cycleId = "WERKLES-FLOCK-20260720-000255-ET-BETSY-01";
const legacyLabel = "VPG28";
const packetPaths = ["packet-a.md", "packet-b.md"];
const pReceipts = ["p-a.md", "p-b.md"];
const gReceipts = ["g-a.md", "g-b.md"];
const aggregate = "aggregate.md";
const attestationPath = "attestation.json";

function markdown() {
  return `STATUS: \`COMPLETED\`\nCYCLE_ID: \`${cycleId}\`\nLEGACY_LABEL: \`${legacyLabel}\`\n`;
}

function baseInput() {
  const record = {
    cycle_id: cycleId,
    legacy_label: legacyLabel,
    ordinal_claim: null,
    kind: "fresh_cycle",
    parent_cycle_id: null,
    status: "COMPLETED",
    packet_paths: packetPaths,
    receipt_paths: { p: pReceipts, g: gReceipts, aggregate },
    approval_log_path: "approval.md",
    release: {
      attestation_path: attestationPath,
      candidate: { deployment_id: "dpl_candidate", source_sha: "product_sha" },
      production: { deployment_id: "dpl_production", release_label: "VPG22", changed_by_cycle: false }
    }
  };
  const artifacts = Object.fromEntries(
    [...packetPaths, ...pReceipts, ...gReceipts, aggregate].map((entry) => [entry, markdown()])
  );
  artifacts[attestationPath] = JSON.stringify({
    cycle_id: cycleId,
    legacy_label: legacyLabel,
    candidate: { deployment_id: "dpl_candidate", source_sha: "product_sha" },
    production: { deployment_id: "dpl_production", release_label: "VPG22", changed_by_cycle: false }
  });
  return {
    record,
    artifacts,
    approvalText: `${cycleId} ${legacyLabel} APPROVED`,
    historyPaths: ["foreman/receipts/WERKLES_FULL_FLOCK_VPG27_20260719.md"],
    knownCycles: []
  };
}

function clone(value) {
  return structuredClone(value);
}

const cases = [
  { name: "complete unique cycle passes", mutate() {}, ok: true, reasons: [] },
  {
    name: "reused cycle ID stops",
    mutate(input) { input.knownCycles.push({ cycle_id: cycleId, legacy_label: "VPG27" }); },
    ok: false,
    reasons: ["CYCLE_ID_REUSED"]
  },
  {
    name: "reused legacy label stops",
    mutate(input) { input.knownCycles.push({ cycle_id: "WERKLES-FLOCK-20260719-010101-ET-BETSY-01", legacy_label: legacyLabel }); },
    ok: false,
    reasons: ["LEGACY_LABEL_REUSED"]
  },
  {
    name: "missing legacy label stops",
    mutate(input) { input.record.legacy_label = ""; },
    ok: false,
    reasons: ["MISSING_LEGACY_LABEL"]
  },
  {
    name: "preexisting label in history stops",
    mutate(input) { input.historyPaths.push("foreman/receipts/OLDER_VPG28.md"); },
    ok: false,
    reasons: ["LEGACY_LABEL_PREEXISTED_CYCLE"]
  },
  {
    name: "missing packet stops",
    mutate(input) { input.record.packet_paths = [packetPaths[0]]; },
    ok: false,
    reasons: ["PACKET_COUNT_MISMATCH"]
  },
  {
    name: "missing completion receipt stops",
    mutate(input) { delete input.artifacts[gReceipts[1]]; },
    ok: false,
    reasons: ["COMPLETION_ARTIFACT_MISSING"]
  },
  {
    name: "unsupported ordinal stops",
    mutate(input) { input.record.ordinal_claim = 28; },
    ok: false,
    reasons: ["UNSUPPORTED_ORDINAL_CLAIM"]
  },
  {
    name: "candidate mismatch stops",
    mutate(input) {
      const attestation = JSON.parse(input.artifacts[attestationPath]);
      attestation.candidate.source_sha = "wrong";
      input.artifacts[attestationPath] = JSON.stringify(attestation);
    },
    ok: false,
    reasons: ["CANDIDATE_EVIDENCE_MISMATCH"]
  },
  {
    name: "Production mismatch stops",
    mutate(input) {
      const attestation = JSON.parse(input.artifacts[attestationPath]);
      attestation.production.deployment_id = "wrong";
      input.artifacts[attestationPath] = JSON.stringify(attestation);
    },
    ok: false,
    reasons: ["PRODUCTION_EVIDENCE_MISMATCH"]
  },
  {
    name: "continuation without parent stops",
    mutate(input) { input.record.kind = "continuation"; },
    ok: false,
    reasons: ["CONTINUATION_PARENT_MISSING"]
  }
];

for (const testCase of cases) {
  const input = clone(baseInput());
  testCase.mutate(input);
  const result = evaluateFlockCycleIdentity(input);
  assert.equal(result.ok, testCase.ok, `${testCase.name}: result mismatch`);
  const reasonCodes = result.reasons.map((entry) => entry.reason);
  for (const reason of testCase.reasons) {
    assert.ok(reasonCodes.includes(reason), `${testCase.name}: missing ${reason}`);
  }
  console.log(`PASS ${testCase.name}`);
}

console.log(`FLOCK_CYCLE_IDENTITY_GUARD_SMOKE: PASS (${cases.length} cases)`);

