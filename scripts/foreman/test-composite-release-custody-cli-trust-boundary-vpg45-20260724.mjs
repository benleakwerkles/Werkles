#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  evaluateCompositeReleaseCustody,
  trustedEvidenceDigest
} from "./composite-release-custody-guard-vpg45-20260724.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const fixture = JSON.parse(
  readFileSync(
    path.join(
      repoRoot,
      "scripts/foreman/fixtures/vpg45-composite-release-custody-complete-20260724.json"
    ),
    "utf8"
  )
);
fixture.trusted_evidence.snapshotDigest = trustedEvidenceDigest(fixture.trusted_evidence);
fixture.request.evidenceDigest = fixture.trusted_evidence.snapshotDigest;

const direct = evaluateCompositeReleaseCustody(
  fixture.request,
  fixture.trusted_evidence
);
assert.equal(direct.result, "PASS", "synthetic pure-evaluator control must remain testable");

const tempRoot = mkdtempSync(path.join(tmpdir(), "werkles-vpg45-cli-"));
try {
  const requestPath = path.join(tempRoot, "request.json");
  const trustedPath = path.join(tempRoot, "trusted.json");
  writeFileSync(requestPath, JSON.stringify(fixture.request));
  writeFileSync(trustedPath, JSON.stringify(fixture.trusted_evidence));

  const cli = spawnSync(
    process.execPath,
    [
      path.join(scriptDir, "composite-release-custody-guard-vpg45-20260724.mjs"),
      "--request",
      requestPath,
      "--trusted-evidence",
      trustedPath,
      "--json"
    ],
    { cwd: repoRoot, encoding: "utf8" }
  );
  assert.equal(cli.status, 1, "caller-supplied raw evidence CLI must refuse authority");
  const receipt = JSON.parse(cli.stdout);
  assert.equal(receipt.result, "STOP");
  assert.ok(
    receipt.reasons.some(
      (reason) => reason.code === "NON_AUTHORITATIVE_EVIDENCE_SOURCE"
    )
  );

  console.log(
    JSON.stringify(
      {
        cycle_id: fixture.cycle_id,
        legacy_label: fixture.legacy_label,
        direct_synthetic_control: direct.result,
        raw_cli_authority: receipt.result,
        raw_cli_reason: "NON_AUTHORITATIVE_EVIDENCE_SOURCE",
        result: "PASS"
      },
      null,
      2
    )
  );
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
