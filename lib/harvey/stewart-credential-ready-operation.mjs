import { createHash } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";
import { validateCredentialSourceReadiness } from "./credential-source-readiness.mjs";
import { compileStewartBackgroundCredentialOperation, runStewartBackgroundCredentialOperation } from "./stewart-background-credential-operation.mjs";

const HASH = /^[a-f0-9]{64}$/;
const FIELDS = ["credential_source_readiness", "credential_source_readiness_sha256", "schema", "stewart"];
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) fail(code);
}
export function compileStewartCredentialReadyOperation({ credentialSourceReadiness, authorityRecord, operatorAuthority, observation, machine, now = Date.now() }) {
  const payload = authorityRecord?.payload;
  const readiness = validateCredentialSourceReadiness(credentialSourceReadiness, {
    machine,
    account_scope_sha256: payload?.account_ref_sha256,
    provider_scope_sha256: payload?.canonical_origin_sha256,
    now,
    requireReady: true,
  });
  const stewart = compileStewartBackgroundCredentialOperation({ authorityRecord, operatorAuthority, observation, now });
  return Object.freeze({
    schema: "pookakind.stewart-credential-ready-operation/v1",
    credential_source_readiness: readiness,
    credential_source_readiness_sha256: digest(readiness),
    stewart,
  });
}

export async function runStewartCredentialReadyOperation({ compiled, now = Date.now(), ...executor }) {
  exact(compiled, FIELDS, "STEWART_CREDENTIAL_READY_WRAPPER_INVALID");
  if (compiled.schema !== "pookakind.stewart-credential-ready-operation/v1"
    || !HASH.test(compiled.credential_source_readiness_sha256 ?? "")
    || digest(compiled.credential_source_readiness) !== compiled.credential_source_readiness_sha256) fail("STEWART_CREDENTIAL_READY_WRAPPER_INVALID");
  validateCredentialSourceReadiness(compiled.credential_source_readiness, { now, requireReady: true });
  return runStewartBackgroundCredentialOperation({ compiled: compiled.stewart, ...executor });
}
