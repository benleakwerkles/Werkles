import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateDependencySecurityIntegrity } from "./dependency-security-integrity-guard-vpg43-20260724.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contract = JSON.parse(
  readFileSync(
    path.join(root, "scripts/foreman/fixtures/vpg43-dependency-security-candidate-20260724.json"),
    "utf8"
  )
);

function completeInput() {
  return {
    contract: structuredClone(contract),
    manifest: structuredClone(contract.smoke_fixture.manifest),
    lock: structuredClone(contract.smoke_fixture.lock),
    audit: structuredClone(contract.smoke_fixture.audit),
    auditError: null
  };
}

const cases = [
  {
    name: "complete patched candidate passes",
    mutate() {},
    expectPass: true
  },
  {
    name: "unexpected root production dependency fails closed",
    mutate(input) {
      input.manifest.dependencies.unapproved = "1.0.0";
    },
    expectReason: "ROOT_DEPENDENCY_SURFACE_MISMATCH"
  },
  {
    name: "missing scoped PostCSS override fails closed",
    mutate(input) {
      delete input.manifest.overrides.next.postcss;
    },
    expectReason: "DEPENDENCY_OVERRIDE_MISMATCH"
  },
  {
    name: "Next below patched floor fails closed",
    mutate(input) {
      input.lock.packages["node_modules/next"].version = "15.5.20";
    },
    expectReason: "NEXT_VERSION_OUT_OF_RANGE"
  },
  {
    name: "Next semver-major drift fails closed",
    mutate(input) {
      input.lock.packages["node_modules/next"].version = "16.0.0";
    },
    expectReason: "NEXT_VERSION_OUT_OF_RANGE"
  },
  {
    name: "vulnerable nested PostCSS fails closed",
    mutate(input) {
      input.lock.packages["node_modules/next/node_modules/postcss"].version = "8.5.17";
    },
    expectReason: "POSTCSS_VERSION_OUT_OF_RANGE"
  },
  {
    name: "vulnerable Sharp fails closed",
    mutate(input) {
      input.lock.packages["node_modules/sharp"].version = "0.34.5";
    },
    expectReason: "SHARP_VERSION_OUT_OF_RANGE"
  },
  {
    name: "Next family mismatch fails closed",
    mutate(input) {
      input.lock.packages["node_modules/@next/env"].version = "15.5.20";
    },
    expectReason: "NEXT_FAMILY_VERSION_MISMATCH"
  },
  {
    name: "missing registry integrity fails closed",
    mutate(input) {
      delete input.lock.packages["node_modules/sharp"].integrity;
    },
    expectReason: "LOCK_INTEGRITY_MISSING"
  },
  {
    name: "local lock resolution fails closed",
    mutate(input) {
      input.lock.packages["node_modules/postcss"].resolved = "file:../postcss";
    },
    expectReason: "LOCK_RESOLUTION_UNTRUSTED"
  },
  {
    name: "lock root divergence fails closed",
    mutate(input) {
      input.lock.packages[""].dependencies.next = "^15.5.20";
    },
    expectReason: "LOCK_ROOT_SURFACE_MISMATCH"
  },
  {
    name: "remaining high audit finding fails closed",
    mutate(input) {
      input.audit.metadata.vulnerabilities.high = 1;
      input.audit.metadata.vulnerabilities.total = 1;
      input.audit.vulnerabilities.next = { name: "next", severity: "high" };
    },
    expectReason: "AUDIT_HIGH_REMAINS"
  },
  {
    name: "remaining critical audit finding fails closed",
    mutate(input) {
      input.audit.metadata.vulnerabilities.critical = 1;
      input.audit.metadata.vulnerabilities.total = 1;
      input.audit.vulnerabilities.sharp = { name: "sharp", severity: "critical" };
    },
    expectReason: "AUDIT_CRITICAL_REMAINS"
  },
  {
    name: "missing audit evidence fails closed",
    mutate(input) {
      input.audit = null;
    },
    expectReason: "AUDIT_EVIDENCE_REQUIRED"
  },
  {
    name: "audit command failure fails closed",
    mutate(input) {
      input.audit = null;
      input.auditError = "registry unavailable";
    },
    expectReason: "AUDIT_COMMAND_FAILED"
  }
];

const failures = [];

for (const testCase of cases) {
  try {
    const input = completeInput();
    testCase.mutate(input);
    const result = evaluateDependencySecurityIntegrity(input);
    assert.equal(result.pass, testCase.expectPass ?? false, `${testCase.name}: pass mismatch`);
    const reasonCodes = result.reasons.map((reason) => reason.code);
    if (testCase.expectReason) {
      assert.ok(reasonCodes.includes(testCase.expectReason), `${testCase.name}: missing ${testCase.expectReason}`);
    } else {
      assert.deepEqual(reasonCodes, [], `${testCase.name}: unexpected failure reasons`);
    }
    console.log(`PASS ${testCase.name}`);
  } catch (error) {
    failures.push(`${testCase.name}: ${error.message}`);
    console.log(`FAIL ${testCase.name}: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error("VPG43_DEPENDENCY_SECURITY_INTEGRITY_SMOKE: FAIL");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`VPG43_DEPENDENCY_SECURITY_INTEGRITY_SMOKE: PASS (${cases.length} cases)`);
