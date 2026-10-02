import { createHash } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const KINDS = Object.freeze({
  recovery: "RECOVERY_IDENTITY_SUBMIT",
  challenge: "EMAIL_OTP_SUBMIT",
  passwordChange: "PASSWORD_RESET",
  freshIdentity: "RECOVERY_IDENTITY_SUBMIT",
  freshSignIn: "SIGN_IN",
});
const ROLES = Object.freeze({
  recovery: ["IDENTITY"],
  challenge: Array.from({ length: 6 }, (_, index) => `EMAIL_OTP_DIGIT_${index + 1}`),
  passwordChange: ["NEW_PASSWORD", "CONFIRM_PASSWORD"],
  freshIdentity: ["IDENTITY"],
  freshSignIn: ["IDENTITY", "CURRENT_PASSWORD"],
});

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function exact(value, fields) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join("|") !== [...fields].sort().join("|")) fail("STEWART_DISNEY_STAGE_SURFACE_INVALID");
}
function handleFor(role, handles) {
  if (role === "IDENTITY") return handles[0];
  if (role.startsWith("EMAIL_OTP_DIGIT_")) return handles[0];
  if (role === "NEW_PASSWORD" || role === "CONFIRM_PASSWORD") return handles[0];
  if (role === "CURRENT_PASSWORD") return handles[1];
  fail("STEWART_DISNEY_STAGE_ROLE_INVALID");
}

/**
 * Package-owned, just-in-time authority compiler. The production signer may
 * be invoked only for the exact fresh stage observation and the handle refs
 * actually available after the preceding stage. The credential executor
 * independently verifies this record against the activation's Operator pin.
 */
export function createStewartDisneyDynamicStageOperations({ observeStage, signRecord, now = () => Date.now() }) {
  if (typeof observeStage !== "function" || typeof signRecord !== "function" || typeof now !== "function") fail("STEWART_DISNEY_STAGE_ADAPTER_INVALID");
  return Object.freeze(Object.fromEntries(Object.keys(KINDS).map((name) => [name, Object.freeze({
    async prepare({ stage, handles, flow_operation_sha256, account_ref_sha256 }) {
      if (stage !== name || !HASH.test(flow_operation_sha256 ?? "") || !HASH.test(account_ref_sha256 ?? "")
        || !Array.isArray(handles) || handles.length !== (name === "freshSignIn" ? 2 : 1)
        || handles.some((handle) => !HASH.test(handle?.ref_sha256 ?? ""))
        || handles[0].schema !== (name === "challenge" ? "pookakind.stewart-private-inbox-email-otp-handle/v1" : "pookakind.stewart-opaque-credential-handle/v1")
        || (name === "freshSignIn" && (handles[1].schema !== "pookakind.stewart-opaque-credential-handle/v1" || handles[1].ref_sha256 === handles[0].ref_sha256))) fail("STEWART_DISNEY_STAGE_BINDING_INVALID");
      const supplied = await observeStage({ stage, operation_kind: KINDS[name], account_ref_sha256 });
      exact(supplied, ["descriptor", "observation"]);
      const { descriptor, observation } = supplied;
      if (observation?.schema !== "pookakind.stewart-background-credential-observation/v1"
        || observation.account_ref_sha256 !== account_ref_sha256
        || observation.provider_response_contract_sha256 !== digest(descriptor)
        || !Array.isArray(observation.field_controls)
        || canonicalJson(observation.field_controls.map(({ role }) => role)) !== canonicalJson(ROLES[name])) fail("STEWART_DISNEY_STAGE_SURFACE_INVALID");
      const issued = now();
      if (!Number.isFinite(issued)) fail("STEWART_DISNEY_STAGE_CLOCK_INVALID");
      const fields = observation.field_controls.map(({ role, control_sha256 }) => ({
        role, control_sha256, handle_ref_sha256: handleFor(role, handles).ref_sha256,
      }));
      const payload = {
        schema: "pookakind.stewart-background-credential-authority/v1",
        operation_kind: KINDS[name], operation_id_sha256: digest([flow_operation_sha256, stage]),
        account_ref_sha256, canonical_origin_sha256: observation.canonical_origin_sha256,
        route_epoch_sha256: observation.route_epoch_sha256, tab_id_sha256: observation.tab_id_sha256,
        form_sha256: observation.form_sha256, fields,
        final_control_sha256: observation.final_control_sha256,
        provider_response_contract_sha256: observation.provider_response_contract_sha256,
        issued_at: new Date(issued).toISOString(), expires_at: new Date(issued + 10_000).toISOString(),
        max_uses: 1, live_execution_authorized: true,
      };
      const audience = ["stewart-background-credential-operation/v1", payload.operation_id_sha256,
        payload.account_ref_sha256, payload.canonical_origin_sha256, payload.route_epoch_sha256,
        payload.tab_id_sha256, payload.form_sha256, digest(payload.fields),
        payload.final_control_sha256, payload.provider_response_contract_sha256].join(":");
      const authorityRecord = await signRecord({ payload, issuer: "pookakind-operator", audience });
      return Object.freeze({ descriptor, observation, authorityRecord });
    },
  })])));
}
