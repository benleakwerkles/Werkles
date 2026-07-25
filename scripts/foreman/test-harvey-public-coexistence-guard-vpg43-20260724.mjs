#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateHarveyPublicCoexistence } from "./harvey-public-coexistence-guard-vpg43-20260724.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixture = JSON.parse(
  readFileSync(
    path.join(root, "scripts/foreman/fixtures/vpg43-harvey-public-coexistence-current-20260724.json"),
    "utf8"
  )
);

function evaluate(mutator = () => {}) {
  const input = structuredClone(fixture);
  const observed = [...input.missing_paths];
  mutator(input, observed);
  return evaluateHarveyPublicCoexistence(input, observed);
}

const cases = [
  {
    name: "current candidate stops on all 37 unresolved Harvey removals",
    mutate() {},
    pass: false,
    reasons: ["HARVEY_PATH_REMOVAL_UNRESOLVED", "COEXISTENCE_DECISION_UNRESOLVED"]
  },
  {
    name: "inventory drift stops",
    mutate(_input, observed) {
      observed.pop();
    },
    pass: false,
    reasons: ["LIVE_GIT_INVENTORY_DRIFT"]
  },
  {
    name: "digest tampering stops",
    mutate(input) {
      input.missing_path_inventory_sha256_lf = "0".repeat(64);
    },
    pass: false,
    reasons: ["INVENTORY_DIGEST_MISMATCH"]
  },
  {
    name: "rollback cannot be mislabeled as coexistence",
    mutate(input) {
      input.rollback.is_coexistence = true;
    },
    pass: false,
    reasons: ["ROLLBACK_MISLABELED_AS_COEXISTENCE"]
  },
  {
    name: "non-preserving default stops",
    mutate(input) {
      input.decision.default = "REPLACE_HARVEY";
    },
    pass: false,
    reasons: ["DEFAULT_IS_NOT_PRESERVE_HARVEY"]
  },
  {
    name: "complete explicit resolution passes the structural guard",
    mutate(input) {
      input.authorized_removals = [...input.missing_paths];
      input.decision.state = "RESOLVED";
    },
    pass: true,
    reasons: []
  }
];

const failures = [];
for (const testCase of cases) {
  try {
    const result = evaluate(testCase.mutate);
    assert.equal(result.pass, testCase.pass, `${testCase.name}: pass mismatch`);
    const codes = result.reasons.map((reason) => reason.code);
    for (const reason of testCase.reasons) {
      assert.ok(codes.includes(reason), `${testCase.name}: missing ${reason}`);
    }
    console.log(`PASS ${testCase.name}`);
  } catch (error) {
    failures.push(`${testCase.name}: ${error.message}`);
    console.log(`FAIL ${testCase.name}: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error("VPG43_HARVEY_PUBLIC_COEXISTENCE_GUARD_SMOKE: FAIL");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`VPG43_HARVEY_PUBLIC_COEXISTENCE_GUARD_SMOKE: PASS (${cases.length} cases)`);
