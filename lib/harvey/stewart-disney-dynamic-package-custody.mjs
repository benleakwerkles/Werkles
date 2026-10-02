import { createHash } from "node:crypto";
import { readFileSync, readdirSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

import { canonicalJson, keyFingerprint, verifyDurableRecord } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const ENTRYPOINT = "scripts/foreman/stewart-disney-deferred-package-entrypoint.mjs";
const ACTIVATION_FIELDS = [
  "account_ref_sha256", "approval_log_entry_sha256", "decision", "entrypoint_sha256",
  "expires_at", "foreground_changed", "input_devices_touched", "issued_at", "machine",
  "max_provider_actions", "one_shot", "operation_sha256", "package_files_sha256",
  "package_sha256", "provider_id", "recurrence", "schema", "secret_material_output",
  "source_commit", "source_release_sha256", "stage_count",
];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function hashBytes(value) { return createHash("sha256").update(value).digest("hex"); }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
}
function list(root, directory = root) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) fail("STEWART_DISNEY_DYNAMIC_PACKAGE_LINK_FORBIDDEN");
    const target = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...list(root, target));
    else if (entry.isFile()) files.push(relative(root, target).replaceAll("\\", "/"));
    else fail("STEWART_DISNEY_DYNAMIC_PACKAGE_ENTRY_INVALID");
  }
  return files;
}

export function observeStewartDisneyDynamicPackage(packageRoot, { listFiles = list, readFile = readFileSync, realpath = realpathSync } = {}) {
  const root = realpath(resolve(packageRoot));
  const files = listFiles(root).slice().sort().map((relative_path) => {
    if (!relative_path || isAbsolute(relative_path) || relative_path.split("/").includes("..")) fail("STEWART_DISNEY_DYNAMIC_PACKAGE_PATH_INVALID");
    return Object.freeze({ relative_path, sha256: hashBytes(readFile(join(root, ...relative_path.split("/")))) });
  });
  if (files.length < 9 || new Set(files.map(({ relative_path }) => relative_path)).size !== files.length) fail("STEWART_DISNEY_DYNAMIC_PACKAGE_INCOMPLETE");
  const packageFilesSha256 = digest(files);
  const packageSha256 = hashBytes(files.map(({ relative_path, sha256 }) => `${relative_path}:${sha256}`).join("\n"));
  return Object.freeze({
    schema: "pookakind.stewart-disney-dynamic-package-observation/v1",
    state: "EXACT_HASH_VERIFIED",
    package_sha256: packageSha256,
    package_files_sha256: packageFilesSha256,
    file_count: files.length,
    files: Object.freeze(files),
  });
}

export function verifyStewartDisneyDynamicActivation({ package_observation, operator_authority, activation_record, entrypoint_sha256, now = Date.now() }) {
  if (!package_observation || package_observation.schema !== "pookakind.stewart-disney-dynamic-package-observation/v1"
    || package_observation.state !== "EXACT_HASH_VERIFIED" || !HASH.test(package_observation.package_sha256 ?? "")
    || !HASH.test(package_observation.package_files_sha256 ?? "") || package_observation.file_count !== package_observation.files?.length
    || package_observation.files.some((file) => {
      if (!file || typeof file !== "object" || Array.isArray(file) || Object.keys(file).sort().join("|") !== "relative_path|sha256") return true;
      return !file.relative_path || isAbsolute(file.relative_path) || file.relative_path.split("/").includes("..") || !HASH.test(file.sha256 ?? "");
    })
    || new Set(package_observation.files.map(({ relative_path }) => relative_path)).size !== package_observation.files.length
    || digest(package_observation.files) !== package_observation.package_files_sha256
    || hashBytes(package_observation.files.map(({ relative_path, sha256 }) => `${relative_path}:${sha256}`).join("\n")) !== package_observation.package_sha256) fail("STEWART_DISNEY_DYNAMIC_PACKAGE_INVALID");
  if (operator_authority?.schema !== "pookakind.operator-authority-pin/v1" || typeof operator_authority.public_key_pem !== "string"
    || keyFingerprint(operator_authority.public_key_pem) !== operator_authority.public_key_sha256) fail("STEWART_DISNEY_DYNAMIC_AUTHORITY_INVALID");
  let payload;
  try { payload = verifyDurableRecord(operator_authority.public_key_pem, activation_record, { issuer: "pookakind-operator", audience: "stewart-disney-dynamic-package/v1" }); }
  catch { fail("STEWART_DISNEY_DYNAMIC_ACTIVATION_SIGNATURE_INVALID"); }
  exact(payload, ACTIVATION_FIELDS, "STEWART_DISNEY_DYNAMIC_ACTIVATION_FIELDS_INVALID");
  const issued = Date.parse(payload.issued_at); const expires = Date.parse(payload.expires_at); const timestamp = Number(now);
  if (payload.schema !== "pookakind.stewart-disney-dynamic-activation/v1" || payload.decision !== "APPROVED"
    || payload.machine !== "DOSS" || payload.provider_id !== "DISNEY_MYDISNEY" || payload.one_shot !== true
    || payload.recurrence !== false || payload.foreground_changed !== false || payload.input_devices_touched !== false
    || payload.secret_material_output !== false || payload.stage_count !== 10 || payload.max_provider_actions !== 6
    || payload.package_sha256 !== package_observation.package_sha256 || payload.package_files_sha256 !== package_observation.package_files_sha256
    || payload.entrypoint_sha256 !== entrypoint_sha256 || !HASH.test(entrypoint_sha256 ?? "")
    || !HASH.test(payload.source_release_sha256 ?? "") || !COMMIT.test(payload.source_commit ?? "")
    || !HASH.test(payload.operation_sha256 ?? "") || !HASH.test(payload.account_ref_sha256 ?? "") || !HASH.test(payload.approval_log_entry_sha256 ?? "")
    || !Number.isFinite(issued) || !Number.isFinite(expires) || expires <= issued || expires - issued > 15 * 60_000
    || issued > timestamp + 30_000 || expires < timestamp) fail("STEWART_DISNEY_DYNAMIC_ACTIVATION_INVALID");
  return Object.freeze({ ...payload, activation_record_sha256: digest(activation_record), entrypoint: ENTRYPOINT });
}

export function verifyStewartDisneyDynamicApprovalLog({ approval_log_path, approval_log_entry_sha256, package_sha256 }) {
  if (!HASH.test(approval_log_entry_sha256 ?? "") || !HASH.test(package_sha256 ?? "")) fail("STEWART_DISNEY_DYNAMIC_APPROVAL_INPUT_INVALID");
  const lines = readFileSync(approval_log_path, "utf8").split(/\r?\n/).filter((line) => hashBytes(line) === approval_log_entry_sha256);
  if (lines.length !== 1 || !lines[0].includes(package_sha256) || !/\|\s*APPROVED(?:\s|—|-|\|)/.test(lines[0])) fail("STEWART_DISNEY_DYNAMIC_APPROVAL_NOT_FOUND");
  return Object.freeze({ state: "EXACT_APPROVAL_LOG_ENTRY_VERIFIED", approval_log_entry_sha256, package_sha256 });
}
