#!/usr/bin/env node
import { strict as assert } from "node:assert";
import {
  evaluateAliasGuard,
  REQUIRED_ALIAS_GATE
} from "./deploy-alias-guard.mjs";

const cases = [
  {
    name: "preview without aliases passes",
    input: { deployTarget: "preview" },
    expectOk: true,
    expectReasons: []
  },
  {
    name: "preview blocks werkles.com production alias",
    input: { deployTarget: "preview", aliases: ["werkles.com"], humanGate: REQUIRED_ALIAS_GATE },
    expectOk: false,
    expectReasons: ["BLOCKED_PREVIEW_PRODUCTION_ALIAS"]
  },
  {
    name: "preview alias change requires Tier 1 human gate",
    input: { deployTarget: "preview", aliases: ["preview-smoke-werkles.vercel.app"] },
    expectOk: false,
    expectReasons: ["ALIAS_CHANGE_REQUIRES_TIER_1_HUMAN_GATE"]
  },
  {
    name: "preview refuses production alias config before file read",
    input: {
      deployTarget: "preview",
      productionAliasConfig: "deploy/DO_NOT_READ_THIS_FILE.json"
    },
    expectOk: false,
    expectReasons: ["PREVIEW_CANNOT_READ_PRODUCTION_ALIAS_CONFIG"]
  },
  {
    name: "production alias change requires Tier 1 human gate",
    input: { deployTarget: "production", aliases: ["werkles.com"] },
    expectOk: false,
    expectReasons: ["ALIAS_CHANGE_REQUIRES_TIER_1_HUMAN_GATE"]
  },
  {
    name: "production alias with gate must be in production config",
    input: { deployTarget: "production", aliases: ["evil.example.com"], humanGate: REQUIRED_ALIAS_GATE },
    expectOk: false,
    expectReasons: ["ALIAS_NOT_IN_PRODUCTION_CONFIG"]
  },
  {
    name: "production alias in config passes with Tier 1 gate",
    input: { deployTarget: "production", aliases: ["werkles.com"], humanGate: REQUIRED_ALIAS_GATE },
    expectOk: true,
    expectReasons: []
  },
  {
    name: "receipt includes required deploy alias fields",
    input: {
      deployTarget: "preview",
      aliasRequested: false,
      appliedAliases: []
    },
    expectOk: true,
    expectReasons: [],
    assertReceipt(receipt) {
      for (const field of ["deploy_target", "alias_requested", "alias_applied", "alias_guard_result"]) {
        assert.ok(Object.hasOwn(receipt, field), `missing receipt field ${field}`);
      }
    }
  }
];

const failures = [];

for (const testCase of cases) {
  try {
    const result = evaluateAliasGuard(testCase.input);
    assert.equal(result.ok, testCase.expectOk, `${testCase.name}: ok mismatch`);
    const reasons = result.receipt.reasons.map((entry) => entry.reason);
    for (const reason of testCase.expectReasons) {
      assert.ok(reasons.includes(reason), `${testCase.name}: missing reason ${reason}`);
    }
    testCase.assertReceipt?.(result.receipt);
    console.log(`PASS ${testCase.name}`);
  } catch (error) {
    failures.push(`${testCase.name}: ${error.message}`);
    console.log(`FAIL ${testCase.name}: ${error.message}`);
  }
}

if (failures.length) {
  console.error("DEPLOY_ALIAS_GUARD_SMOKE: FAIL");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("DEPLOY_ALIAS_GUARD_SMOKE: PASS");
