import { createHash } from "node:crypto";

import {
  compileBackgroundFinalControl,
  runBackgroundFinalControl,
} from "./blind-secret-background-final-control.mjs";
import { canonicalJson } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const WRAPPER_FIELDS = [
  "admission", "admission_sha256", "compatibility_protocol", "live_action_performed",
  "organ_name", "recurring_operation_created", "schema", "secret_material_returned",
];
const ADMISSION_FIELDS = ["command", "decision", "reason", "request_sha256", "schema"];
const ADMISSION_SCHEMA = "pookakind.background-final-control-admission/v1";
const PREPARED_REASON = "LIVE_PROVIDER_MUTATION_AUTHORITY_REQUIRED";
const EXECUTE_REASON = "EXACT_BACKGROUND_FINAL_CONTROL_AUTHORIZED";

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) fail(code);
}

function digest(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function validateAdmission(admission) {
  exact(admission, ADMISSION_FIELDS, "STEWART_PASSWORD_FINAL_CONTROL_ADMISSION_FIELDS_INVALID");
  if (admission.schema !== ADMISSION_SCHEMA || !HASH.test(admission.request_sha256 ?? "")) {
    fail("STEWART_PASSWORD_FINAL_CONTROL_ADMISSION_INVALID");
  }
  if (admission.decision === "PREPARED_NOT_ACTIVATED") {
    if (admission.reason !== PREPARED_REASON || admission.command !== null) {
      fail("STEWART_PASSWORD_FINAL_CONTROL_ADMISSION_INVALID");
    }
    return;
  }
  if (admission.decision === "EXECUTE_ONCE") {
    if (admission.reason !== EXECUTE_REASON || !admission.command || typeof admission.command !== "object" || Array.isArray(admission.command)) {
      fail("STEWART_PASSWORD_FINAL_CONTROL_ADMISSION_INVALID");
    }
    return;
  }
  fail("STEWART_PASSWORD_FINAL_CONTROL_ADMISSION_INVALID");
}

export function compileStewartPasswordFinalControl({ authority, observation, now = Date.now() }) {
  const admission = structuredClone(compileBackgroundFinalControl({ authority, observation, now }));
  validateAdmission(admission);
  const compiled = {
    schema: "pookakind.stewart-password-final-control-admission/v1",
    organ_name: "Stewart",
    compatibility_protocol: "POOKAKIND_BACKGROUND_FINAL_CONTROL_V1",
    admission,
    admission_sha256: digest(admission),
    live_action_performed: false,
    secret_material_returned: false,
    recurring_operation_created: false,
  };
  return deepFreeze(compiled);
}

export async function runStewartPasswordFinalControl({ compiled, consume, invoke, readback }) {
  exact(compiled, WRAPPER_FIELDS, "STEWART_PASSWORD_FINAL_CONTROL_COMPOSITION_INVALID");
  if (
    compiled.schema !== "pookakind.stewart-password-final-control-admission/v1"
    || compiled.organ_name !== "Stewart"
    || compiled.compatibility_protocol !== "POOKAKIND_BACKGROUND_FINAL_CONTROL_V1"
    || !HASH.test(compiled.admission_sha256 ?? "")
    || compiled.live_action_performed !== false
    || compiled.secret_material_returned !== false
    || compiled.recurring_operation_created !== false
  ) fail("STEWART_PASSWORD_FINAL_CONTROL_COMPOSITION_INVALID");
  const admission = structuredClone(compiled.admission);
  validateAdmission(admission);
  if (digest(admission) !== compiled.admission_sha256) fail("STEWART_PASSWORD_FINAL_CONTROL_ADMISSION_CUSTODY_CONFLICT");
  if (admission.decision !== "EXECUTE_ONCE") {
    return Object.freeze({
      schema: "pookakind.stewart-password-final-control-receipt/v1",
      organ_name: "Stewart",
      state: "PREPARED_NOT_ACTIVATED",
      reason: PREPARED_REASON,
      invoke_calls: 0,
      fixed: false,
      secret_material_returned: false,
      recurring_operation_created: false,
    });
  }
  const result = await runBackgroundFinalControl({
    command: admission.command,
    consume,
    invoke,
    readback,
  });
  return Object.freeze({
    schema: "pookakind.stewart-password-final-control-receipt/v1",
    organ_name: "Stewart",
    state: result.state,
    provider_state_sha256: result.provider_state_sha256 ?? null,
    invoke_calls: result.invoke_calls,
    fixed: false,
    secret_material_returned: false,
    recurring_operation_created: false,
  });
}
