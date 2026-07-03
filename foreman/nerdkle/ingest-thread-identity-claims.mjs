#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INBOX = "foreman/nerdkle/thread_identity_claims/inbox";
const REGISTRY_PATH = "foreman/nerdkle/thread_registry.json";
const OUTPUT_PATH = "foreman/artifacts/thread_identity_claims_status.json";

const REQUIRED_FIELDS = [
  "claim_id",
  "address",
  "platform",
  "proof_scope",
  "thread_id",
  "observed_at",
  "evidence",
];
const PLATFORMS = new Set([
  "local_file",
  "codex_thread",
  "chatgpt",
  "claude",
  "gemini",
  "cursor",
  "doss_remote",
]);
const PROOF_SCOPES = new Set([
  "local_daemon",
  "local_codex_index",
  "external_platform",
  "remote_machine",
]);
const SECRET_PATTERNS = [
  /api[_-]?key/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /password/i,
  /cookie/i,
  /secret/i,
  /bearer\s+[a-z0-9._-]+/i,
];

function abs(relPath) {
  return path.join(ROOT, relPath);
}

function exists(relPath) {
  return fs.existsSync(abs(relPath));
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(abs(relPath), "utf8"));
}

function listClaimFiles() {
  if (!exists(INBOX)) return [];
  return fs.readdirSync(abs(INBOX), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(INBOX, entry.name).replace(/\\/g, "/"))
    .sort();
}

function hasSecretText(value) {
  const text = JSON.stringify(value);
  return SECRET_PATTERNS.some((pattern) => pattern.test(text));
}

function validateClaim(claim, registryAddresses) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(claim, field)) errors.push(`missing:${field}`);
  }
  if (claim.claim_id && !/^[a-z0-9][a-z0-9_.-]{6,120}$/.test(claim.claim_id)) {
    errors.push("invalid:claim_id");
  }
  if (claim.address && !registryAddresses.has(claim.address)) {
    errors.push(`unknown_address:${claim.address}`);
  }
  if (claim.platform && !PLATFORMS.has(claim.platform)) {
    errors.push(`invalid_platform:${claim.platform}`);
  }
  if (claim.proof_scope && !PROOF_SCOPES.has(claim.proof_scope)) {
    errors.push(`invalid_proof_scope:${claim.proof_scope}`);
  }
  if (typeof claim.thread_id !== "string" || claim.thread_id.length < 6) {
    errors.push("invalid:thread_id");
  }
  if (!Array.isArray(claim.evidence) || claim.evidence.length === 0) {
    errors.push("missing:evidence");
  }
  if (Array.isArray(claim.evidence)) {
    for (const [index, evidence] of claim.evidence.entries()) {
      if (!evidence || typeof evidence !== "object") {
        errors.push(`invalid:evidence[${index}]`);
        continue;
      }
      if (!["file", "jsonl_event", "codex_thread", "remote_receipt", "operator_observation"].includes(evidence.kind)) {
        errors.push(`invalid:evidence[${index}].kind`);
      }
      if (typeof evidence.value !== "string" || !evidence.value.trim()) {
        errors.push(`invalid:evidence[${index}].value`);
      }
      if (evidence.kind === "file" && !exists(evidence.value)) {
        errors.push(`missing_file:${evidence.value}`);
      }
    }
  }
  if (claim.proof_scope === "external_platform" && !claim.thread_url) {
    errors.push("external_platform_requires:thread_url");
  }
  if (hasSecretText(claim)) {
    errors.push("forbidden_secret_like_text");
  }
  return errors;
}

function claimStatus(claim, errors) {
  if (errors.length) return "REJECTED";
  if (claim.proof_scope === "external_platform") return "ACCEPTED_EXTERNAL";
  if (claim.proof_scope === "remote_machine") return "ACCEPTED_REMOTE";
  return "ACCEPTED_LOCAL";
}

function main() {
  const registry = readJson(REGISTRY_PATH);
  const registryTargets = Array.isArray(registry.targets) ? registry.targets : [];
  const registryAddresses = new Set(registryTargets.map((target) => target.address));
  const files = listClaimFiles();

  const claims = files.map((file) => {
    let claim = null;
    let errors = [];
    try {
      claim = readJson(file);
      errors = validateClaim(claim, registryAddresses);
    } catch (error) {
      errors = [`bad_json:${error.message}`];
      claim = {};
    }
    return {
      path: file,
      claim_id: claim.claim_id || null,
      address: claim.address || null,
      platform: claim.platform || null,
      proof_scope: claim.proof_scope || null,
      thread_id: claim.thread_id || null,
      thread_url: claim.thread_url || null,
      status: claimStatus(claim, errors),
      errors,
      evidence: Array.isArray(claim.evidence) ? claim.evidence : [],
    };
  });

  const accepted = claims.filter((claim) => claim.status !== "REJECTED");
  const acceptedExternal = accepted.filter((claim) => claim.status === "ACCEPTED_EXTERNAL");
  const acceptedLocal = accepted.filter((claim) => claim.status === "ACCEPTED_LOCAL");
  const acceptedRemote = accepted.filter((claim) => claim.status === "ACCEPTED_REMOTE");
  const externalAddresses = new Set(acceptedExternal.map((claim) => claim.address));
  const localAddresses = new Set(acceptedLocal.map((claim) => claim.address));
  const remoteAddresses = new Set(acceptedRemote.map((claim) => claim.address));

  const missingExternalThreadIds = registryTargets
    .filter((target) => !target.external_thread_id && !externalAddresses.has(target.address))
    .map((target) => target.address);

  const report = {
    artifact_id: "THREAD_IDENTITY_CLAIMS_STATUS_V0",
    generated_at: new Date().toISOString(),
    rule: "Claims are evidence only. Local claims do not satisfy external platform identity.",
    claim_count: claims.length,
    accepted_count: accepted.length,
    accepted_local_count: acceptedLocal.length,
    accepted_external_count: acceptedExternal.length,
    accepted_remote_count: acceptedRemote.length,
    rejected_count: claims.length - accepted.length,
    registry_target_count: registryTargets.length,
    local_identity_addresses: [...localAddresses].sort(),
    external_identity_addresses: [...externalAddresses].sort(),
    remote_identity_addresses: [...remoteAddresses].sort(),
    missing_external_thread_ids: missingExternalThreadIds,
    status: missingExternalThreadIds.length
      ? accepted.length
        ? "PASS_CLAIM_INTAKE_WITH_EXTERNAL_BLOCKERS"
        : "BLOCKED_NO_THREAD_IDENTITY_CLAIMS"
      : "PASS_EXTERNAL_THREAD_IDENTITIES_PRESENT",
    claims,
  };

  fs.mkdirSync(abs(path.dirname(OUTPUT_PATH)), { recursive: true });
  fs.writeFileSync(abs(OUTPUT_PATH), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`${report.status}: wrote ${OUTPUT_PATH}`);
  console.log(`accepted=${accepted.length} external=${acceptedExternal.length} missing_external=${missingExternalThreadIds.length}`);

  if (claims.some((claim) => claim.status === "REJECTED")) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
