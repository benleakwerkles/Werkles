import { createHash, randomBytes } from "node:crypto";

import { compileStewartWindowsSecurityUiAccessOperation } from "./stewart-windows-security-uiaccess-operation.mjs";
import { canonicalJson } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OBSERVATION_FIELDS = ["account_ref_sha256", "broker_sid_sha256", "canonical_origin_sha256", "field_name_sha256", "final_name_sha256", "foreground_changed", "hwnd", "invokable_pattern_count", "machine_sha256", "observed_at", "process_id", "provider_response_contract_sha256", "receipt_root_sha256", "route_epoch_sha256", "schema", "secret_accessed", "tab_id_sha256", "values_read", "window_class", "writable_value_pattern_count"];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) fail(code);
  const keys = Reflect.ownKeys(value); const expected = [...fields].sort();
  if (keys.some((key) => typeof key !== "string") || keys.length !== expected.length) fail(code);
  const actual = keys.map(String).sort();
  for (let index = 0; index < actual.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, actual[index]);
    if (actual[index] !== expected[index] || !descriptor?.enumerable || !("value" in descriptor)) fail(code);
  }
}
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value)) freeze(child); return Object.freeze(value); }

export async function produceStewartWindowsSecurityOperation({ authority, observation, secret_handle_ref_sha256, signer, now = Date.now() }) {
  exact(observation, OBSERVATION_FIELDS, "STEWART_WINDOWS_SECURITY_PRODUCER_OBSERVATION_INVALID");
  exact(signer, ["sign_record"], "STEWART_WINDOWS_SECURITY_PRODUCER_SIGNER_INVALID");
  if (typeof signer.sign_record !== "function") fail("STEWART_WINDOWS_SECURITY_PRODUCER_SIGNER_INVALID");
  for (const field of ["account_ref_sha256", "broker_sid_sha256", "canonical_origin_sha256", "field_name_sha256", "final_name_sha256", "machine_sha256", "provider_response_contract_sha256", "receipt_root_sha256", "route_epoch_sha256", "tab_id_sha256"]) if (!HASH.test(observation[field] ?? "")) fail("STEWART_WINDOWS_SECURITY_PRODUCER_OBSERVATION_INVALID");
  if (!HASH.test(secret_handle_ref_sha256 ?? "") || observation.schema !== "pookakind.stewart-windows-security-exact-observation/v1"
    || !Number.isSafeInteger(observation.process_id) || observation.process_id < 1 || typeof observation.hwnd !== "string" || !/^[1-9][0-9]{0,19}$/.test(observation.hwnd)
    || observation.window_class !== "Credential Dialog Xaml Host" || observation.writable_value_pattern_count !== 1 || observation.invokable_pattern_count !== 1
    || observation.values_read !== false || observation.secret_accessed !== false || observation.foreground_changed !== false) fail("STEWART_WINDOWS_SECURITY_PRODUCER_OBSERVATION_INVALID");
  const observedAt = Date.parse(observation.observed_at);
  if (!Number.isFinite(observedAt) || observedAt > now || now - observedAt > 10_000) fail("STEWART_WINDOWS_SECURITY_PRODUCER_OBSERVATION_STALE");
  const operationId = randomBytes(32).toString("hex");
  const providerScope = createHash("sha256").update(canonicalJson({ account_ref_sha256: observation.account_ref_sha256, canonical_origin_sha256: observation.canonical_origin_sha256, tab_id_sha256: observation.tab_id_sha256 })).digest("hex");
  const payload = freeze({
    schema: "pookakind.stewart-windows-security-operation/v1", action: "SUBMIT_OPAQUE_BLIND_PIN_ONCE", operation_id_sha256: operationId,
    machine_sha256: observation.machine_sha256, broker_sid_sha256: observation.broker_sid_sha256, route_epoch_sha256: observation.route_epoch_sha256,
    process_id: observation.process_id, hwnd: observation.hwnd, window_class: observation.window_class, field_name_sha256: observation.field_name_sha256,
    final_name_sha256: observation.final_name_sha256, secret_handle_ref_sha256, receipt_root_sha256: observation.receipt_root_sha256,
    provider_scope_sha256: providerScope, provider_response_contract_sha256: observation.provider_response_contract_sha256,
    issued_at: new Date(now).toISOString(), expires_at: new Date(now + 20_000).toISOString(), max_uses: 1,
  });
  const authorityRecord = await signer.sign_record(payload, freeze({ issuer: "pookakind-access-steward", audience: `stewart-windows-security:${payload.machine_sha256}:${payload.operation_id_sha256}` }));
  const command = compileStewartWindowsSecurityUiAccessOperation({ authority, authority_record: authorityRecord, expected_machine_sha256: observation.machine_sha256, now });
  return freeze({ schema: "pookakind.stewart-windows-security-operation-production/v1", state: "SIGNED_EXACT_OPERATION_READY", authority_record: authorityRecord, command, secret_material_exposed: false, signer_self_minted: false });
}
