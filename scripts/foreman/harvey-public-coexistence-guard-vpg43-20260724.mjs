#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_INPUT =
  "scripts/foreman/fixtures/vpg43-harvey-public-coexistence-current-20260724.json";

const SHA = /^[0-9a-f]{40}$/;
const ALLOWED_RESOLUTIONS = [
  "INTEGRATE_ALL_PROTECTED_PATHS",
  "RELOCATE_TO_PROVEN_PRIVATE_ORIGIN",
  "EXPLICIT_REPLACEMENT_HUMAN_GATE"
];

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function digestPaths(paths) {
  return createHash("sha256")
    .update(`${sortedUnique(paths).join("\n")}\n`)
    .digest("hex");
}

function sameValues(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function evaluateHarveyPublicCoexistence(input, observedMissingPaths) {
  const reasons = [];
  const stop = (code, detail) => reasons.push({ code, detail });
  const expected = sortedUnique(input?.missing_paths ?? []);
  const observed = sortedUnique(observedMissingPaths ?? []);
  const authorized = sortedUnique(input?.authorized_removals ?? []);

  if (input?.schema !== "werkles.harvey-public-coexistence-current/v1") {
    stop("SCHEMA_MISMATCH", input?.schema ?? null);
  }
  for (const [label, value] of [
    ["PRODUCTION_COMMIT_INVALID", input?.production?.commit],
    ["CANDIDATE_COMMIT_INVALID", input?.candidate?.commit],
    ["MERGE_BASE_INVALID", input?.merge_base],
    ["ROLLBACK_COMMIT_INVALID", input?.rollback?.commit]
  ]) {
    if (!SHA.test(value ?? "")) stop(label, value ?? null);
  }
  if (input?.rollback?.is_coexistence !== false) {
    stop("ROLLBACK_MISLABELED_AS_COEXISTENCE", input?.rollback?.is_coexistence ?? null);
  }
  if (input?.missing_path_count !== expected.length) {
    stop("INVENTORY_COUNT_MISMATCH", {
      declared: input?.missing_path_count ?? null,
      actual: expected.length
    });
  }
  if (expected.length !== 37) {
    stop("PROTECTED_INVENTORY_NOT_37", expected.length);
  }
  const digest = digestPaths(expected);
  if (digest !== input?.missing_path_inventory_sha256_lf) {
    stop("INVENTORY_DIGEST_MISMATCH", {
      declared: input?.missing_path_inventory_sha256_lf ?? null,
      actual: digest
    });
  }
  if (!sameValues(expected, observed)) {
    stop("LIVE_GIT_INVENTORY_DRIFT", { expected, observed });
  }
  const unauthorized = observed.filter((filePath) => !authorized.includes(filePath));
  const unknownAuthorizations = authorized.filter((filePath) => !observed.includes(filePath));
  if (unknownAuthorizations.length > 0) {
    stop("UNKNOWN_REMOVAL_AUTHORIZATION", unknownAuthorizations);
  }

  const allowedResolutions = sortedUnique(input?.decision?.allowed_resolutions ?? []);
  if (!sameValues(allowedResolutions, sortedUnique(ALLOWED_RESOLUTIONS))) {
    stop("RESOLUTION_SET_MISMATCH", allowedResolutions);
  }
  if (input?.decision?.default !== "PRESERVE_HARVEY") {
    stop("DEFAULT_IS_NOT_PRESERVE_HARVEY", input?.decision?.default ?? null);
  }
  if (unauthorized.length > 0) {
    stop("HARVEY_PATH_REMOVAL_UNRESOLVED", unauthorized);
  }
  if (input?.decision?.state !== "RESOLVED" || unauthorized.length > 0) {
    stop("COEXISTENCE_DECISION_UNRESOLVED", input?.decision?.state ?? null);
  }

  return {
    pass: reasons.length === 0,
    result: reasons.length === 0 ? "PASS" : "STOP",
    release_eligible: reasons.length === 0,
    evidence: {
      production_commit: input?.production?.commit ?? null,
      candidate_commit: input?.candidate?.commit ?? null,
      observed_missing_path_count: observed.length,
      observed_inventory_sha256_lf: digestPaths(observed),
      unauthorized_missing_path_count: unauthorized.length,
      rollback_is_coexistence: input?.rollback?.is_coexistence ?? null
    },
    reasons
  };
}

function gitMissingPaths(root, input) {
  const output = execFileSync(
    "git",
    [
      "diff",
      "--name-only",
      "--diff-filter=D",
      `${input.production.commit}..${input.candidate.commit}`,
      "--",
      ...input.protected_pathspecs
    ],
    { cwd: root, encoding: "utf8" }
  );
  return output.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const args = process.argv.slice(2);
  const expectCurrentStop = args.includes("--expect-current-stop");
  const inputArg = args.find((arg) => arg !== "--expect-current-stop") ?? DEFAULT_INPUT;
  const input = JSON.parse(readFileSync(path.resolve(root, inputArg), "utf8"));
  const result = evaluateHarveyPublicCoexistence(input, gitMissingPaths(root, input));
  console.log(JSON.stringify({ ...result, input: inputArg }, null, 2));

  if (expectCurrentStop) {
    const exactStop =
      result.result === "STOP" &&
      result.evidence.observed_missing_path_count === 37 &&
      result.evidence.unauthorized_missing_path_count === 37 &&
      result.reasons.some((reason) => reason.code === "HARVEY_PATH_REMOVAL_UNRESOLVED");
    process.exitCode = exactStop ? 0 : 1;
    return;
  }
  process.exitCode = result.pass ? 0 : 1;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) main();
