import assert from "node:assert/strict";

import { candidateDigest, evaluateLocalCandidate } from "./local-candidate-verifier-vpg32.mjs";

const ownedPaths = [
  { path: "app/example.tsx", sha256: "a".repeat(64) },
  { path: "scripts/example.mjs", sha256: "b".repeat(64) }
];
const attestation = {
  schema: "werkles.local-candidate-attestation/v1",
  attestation_path: "foreman/receipts/attestation.json",
  base_sha: "1".repeat(40),
  branch: "codex/example",
  build_id: "build-1",
  owned_paths: ownedPaths,
  candidate_digest: candidateDigest(ownedPaths),
  versions: { next: "15.5.18", react: "19.2.6", react_dom: "19.2.6", eslint: "9.39.4" },
  qc_results: [{ name: "build", status: "PASS" }]
};
const current = {
  base_sha: attestation.base_sha,
  branch: attestation.branch,
  build_id: attestation.build_id,
  paths: [...ownedPaths.map((entry) => entry.path), attestation.attestation_path],
  entries: ownedPaths,
  versions: { ...attestation.versions }
};

assert.equal(evaluateLocalCandidate(attestation, current).pass, true);

const failures = [
  ["wrong base", { ...current, base_sha: "2".repeat(40) }],
  ["missing path", { ...current, paths: current.paths.slice(1) }],
  ["extra path", { ...current, paths: [...current.paths, "extra.txt"] }],
  ["wrong hash", { ...current, entries: [{ ...ownedPaths[0], sha256: "c".repeat(64) }, ownedPaths[1]] }],
  ["wrong version", { ...current, versions: { ...current.versions, react: "0.0.0" } }],
  ["wrong build", { ...current, build_id: "other" }]
];
for (const [name, candidate] of failures) {
  assert.equal(evaluateLocalCandidate(attestation, candidate).pass, false, `${name} must fail closed`);
}
assert.equal(
  evaluateLocalCandidate({ ...attestation, candidate_digest: "d".repeat(64) }, current).pass,
  false,
  "wrong digest must fail closed"
);

console.log(JSON.stringify({
  pass: true,
  checks: [
    "exact_candidate_passes",
    "wrong_base_fails_closed",
    "missing_path_fails_closed",
    "extra_path_fails_closed",
    "wrong_hash_fails_closed",
    "wrong_version_fails_closed",
    "wrong_build_id_fails_closed",
    "wrong_digest_fails_closed"
  ]
}, null, 2));
