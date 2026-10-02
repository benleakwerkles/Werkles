import { createHash } from "node:crypto";

import { compileStewartBackgroundCredentialOperation, runStewartBackgroundCredentialOperation } from "./stewart-background-credential-operation.mjs";
import { canonicalJson } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const STAGES = Object.freeze({
  recovery: "RECOVERY_IDENTITY_SUBMIT",
  challenge: "EMAIL_OTP_SUBMIT",
  passwordChange: "PASSWORD_RESET",
  freshIdentity: "RECOVERY_IDENTITY_SUBMIT",
  freshSignIn: "SIGN_IN",
});
const PROVIDER_RECEIPT = "pookakind.stewart-background-credential-receipt/v1";

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
}
function commandOf(stage, entry) {
  exact(entry, ["compiled", "descriptor"], "STEWART_DISNEY_PROVIDER_STAGE_CONFIG_INVALID");
  const command = entry.compiled?.admission?.command;
  if (entry.compiled?.schema !== "pookakind.stewart-background-credential-operation/v1"
    || entry.compiled.admission?.decision !== "EXECUTE_ONCE" || !command
    || command.operation_kind !== STAGES[stage]
    || command.provider_response_contract_sha256 !== digest(entry.descriptor)) {
    fail("STEWART_DISNEY_PROVIDER_STAGE_CONFIG_INVALID");
  }
  return command;
}
function handleForRole(role, identityHandle, otpHandle, credentialHandle) {
  if (role === "IDENTITY") return identityHandle;
  if (role === "CURRENT_PASSWORD" || role === "NEW_PASSWORD" || role === "CONFIRM_PASSWORD") return credentialHandle;
  if (/^EMAIL_OTP_DIGIT_[1-6]$/.test(role)) return otpHandle;
  fail("STEWART_DISNEY_PROVIDER_FIELD_ROLE_INVALID");
}
function handlesFor(command, identityHandle, otpHandle, credentialHandle) {
  if (command.operation_kind === "EMAIL_OTP_SUBMIT") return [otpHandle];
  const byRef = new Map();
  for (const { role } of command.fields) {
    const handle = handleForRole(role, identityHandle, otpHandle, credentialHandle);
    byRef.set(handle.ref_sha256, handle);
  }
  return [...byRef.values()];
}
function stageHandles(stage, identityHandle, otpHandle, credentialHandle) {
  const handles = {
    recovery: [identityHandle], challenge: [otpHandle], passwordChange: [credentialHandle],
    freshIdentity: [identityHandle], freshSignIn: [identityHandle, credentialHandle],
  }[stage];
  if (!handles || handles.some((handle) => !handle || !HASH.test(handle.ref_sha256 ?? ""))) fail("STEWART_DISNEY_PROVIDER_HANDLE_NOT_READY");
  return handles;
}

/**
 * Production provider composition for the deferred Disney flow. Every live
 * provider mutation traverses the signed one-use Stewart credential executor;
 * callers cannot substitute a desired receipt for a browser action.
 */
export function createStewartDisneyBackgroundProviderOrgans({
  routeSensor, identityCustody, inbox, vault, providerAdapter, operations,
  credentialHandle, consume, resolveHandle, operatorAuthority, session_ref_sha256,
  flow_operation_sha256, account_ref_sha256, assertCredentialStageScope = null, now = () => Date.now(),
}) {
  exact(operations, Object.keys(STAGES), "STEWART_DISNEY_PROVIDER_OPERATIONS_INVALID");
  if (Object.values(operations).some((entry) => !entry || typeof entry.prepare !== "function")) fail("STEWART_DISNEY_PROVIDER_OPERATIONS_INVALID");
  if (typeof routeSensor?.observeIdentityRoute !== "function" || typeof identityCustody?.bindOpaqueIdentity !== "function"
    || typeof inbox?.captureEmailChallenge !== "function" || typeof vault?.reconcileExactOneVault !== "function"
    || typeof providerAdapter?.observeExtension !== "function" || typeof providerAdapter?.executeExtension !== "function"
    || typeof providerAdapter?.readExtension !== "function" || typeof providerAdapter?.signOutAndClear !== "function"
    || typeof inbox?.bindRecoveryAcceptance !== "function" || typeof consume !== "function" || typeof resolveHandle !== "function" || (assertCredentialStageScope !== null && typeof assertCredentialStageScope !== "function") || typeof now !== "function" || !HASH.test(session_ref_sha256 ?? "")
    || !HASH.test(flow_operation_sha256 ?? "") || !HASH.test(account_ref_sha256 ?? "")
    || operatorAuthority?.schema !== "pookakind.operator-authority-pin/v1"
    || credentialHandle?.schema !== "pookakind.stewart-opaque-credential-handle/v1" || !HASH.test(credentialHandle.ref_sha256 ?? "")) {
    fail("STEWART_DISNEY_PROVIDER_ORGANS_INVALID");
  }
  let identityHandle = null; let otpHandle = null;

  async function execute(stage, request) {
    const handles = stageHandles(stage, identityHandle, otpHandle, credentialHandle);
    const prepared = await operations[stage].prepare(Object.freeze({
      stage, handles: structuredClone(handles), flow_operation_sha256, account_ref_sha256,
    }));
    exact(prepared, ["authorityRecord", "observation", "descriptor"], "STEWART_DISNEY_PROVIDER_STAGE_CONFIG_INVALID");
    const entry = { compiled: compileStewartBackgroundCredentialOperation({
      authorityRecord: prepared.authorityRecord, operatorAuthority,
      observation: prepared.observation, now: now(),
    }), descriptor: prepared.descriptor };
    const command = commandOf(stage, entry);
    if (command.account_ref_sha256 !== account_ref_sha256
      || command.operation_id_sha256 !== digest([flow_operation_sha256, stage])) fail("STEWART_DISNEY_PROVIDER_FLOW_CUSTODY_CONFLICT");
    if (assertCredentialStageScope && (stage === "passwordChange" || stage === "freshSignIn")) assertCredentialStageScope({ stage, command });
    let submittedAt = null;
    const orderedHandles = handlesFor(command, identityHandle, otpHandle, credentialHandle);
    const expectedRefs = [...new Set(command.fields.map(({ handle_ref_sha256 }) => handle_ref_sha256))];
    if (orderedHandles.length !== expectedRefs.length || orderedHandles.some((handle, index) => !handle || handle.ref_sha256 !== expectedRefs[index])) fail("STEWART_DISNEY_PROVIDER_HANDLE_CUSTODY_CONFLICT");
    const receipt = await runStewartBackgroundCredentialOperation({
      compiled: entry.compiled, handles: orderedHandles, consume,
      resolveHandle: (handle) => resolveHandle(handle, { stage, command }),
      executeBackgroundForm: async ({ command: exactCommand, field_material }) => {
        const observed = await providerAdapter.observeExtension(entry.descriptor);
        if (observed.account_ref_sha256 !== exactCommand.account_ref_sha256
          || observed.canonical_origin_sha256 !== exactCommand.canonical_origin_sha256
          || observed.route_epoch_sha256 !== exactCommand.route_epoch_sha256
          || observed.tab_id_sha256 !== exactCommand.tab_id_sha256
          || observed.form_sha256 !== exactCommand.form_sha256
          || observed.final_control_sha256 !== exactCommand.final_control_sha256
          || observed.provider_response_contract_sha256 !== exactCommand.provider_response_contract_sha256) {
          fail("STEWART_DISNEY_PROVIDER_OBSERVATION_DRIFT");
        }
        if (stage === "recovery") submittedAt = now();
        const result = await providerAdapter.executeExtension({ descriptor: entry.descriptor, fields: field_material });
        if (result?.schema !== "pookakind.stewart-extension-dom-execution/v1") fail("STEWART_DISNEY_PROVIDER_EXECUTION_INVALID");
        return Object.freeze({
          field_count: result.field_count,
          field_roles_sha256: digest(result.field_roles),
          final_control_count: result.final_control_invoked === true ? 1 : 0,
          final_control_invoked: result.final_control_invoked,
          foreground_changed: result.foreground_changed,
          cursor_touched: result.input_devices_touched,
          keyboard_touched: result.input_devices_touched,
          clipboard_touched: false,
          secret_material_exposed: result.secret_material_exposed,
        });
      },
      readback: async (exactCommand) => {
        const result = await providerAdapter.readExtension(entry.descriptor);
        if (result?.schema !== "pookakind.stewart-extension-dom-readback/v1" || result.secret_material_exposed !== false) fail("STEWART_DISNEY_PROVIDER_READBACK_INVALID");
        return Object.freeze({
          schema: "pookakind.stewart-background-credential-provider-readback/v1",
          request_sha256: exactCommand.request_sha256,
          canonical_origin_sha256: exactCommand.canonical_origin_sha256,
          route_epoch_sha256: exactCommand.route_epoch_sha256,
          tab_id_sha256: exactCommand.tab_id_sha256,
          provider_response_contract_sha256: exactCommand.provider_response_contract_sha256,
          provider_state_sha256: digest(result),
          response_class: result.response_class,
        });
      },
    });
    if (receipt.schema !== PROVIDER_RECEIPT) fail("STEWART_DISNEY_PROVIDER_RECEIPT_INVALID");
    if (stage === "recovery" && receipt.state === "FACTOR_EMAIL") {
      if (!Number.isFinite(submittedAt) || submittedAt > now()) fail("STEWART_DISNEY_PROVIDER_RECOVERY_CLOCK_INVALID");
      const bound = inbox.bindRecoveryAcceptance({ operation_sha256: request.operation_sha256, binding_sha256: request.binding_sha256, submitted_at: new Date(submittedAt).toISOString() });
      if (bound?.state !== "RECOVERY_ACCEPTANCE_BOUND" || bound.secret_material_returned !== false) fail("STEWART_DISNEY_PROVIDER_RECOVERY_BINDING_INVALID");
    }
    return receipt;
  }

  return Object.freeze({
    routeSensor,
    identityCustody: Object.freeze({
      async bindOpaqueIdentity(request) {
        const result = await identityCustody.bindOpaqueIdentity(request);
        if (result?.handle?.schema !== "pookakind.stewart-opaque-credential-handle/v1" || !HASH.test(result.handle.ref_sha256 ?? "")) fail("STEWART_DISNEY_PROVIDER_IDENTITY_INVALID");
        identityHandle = result.handle; return result;
      },
    }),
    recovery: Object.freeze({ submitRecoveryIdentity: async (request) => execute("recovery", request) }),
    inbox: Object.freeze({
      async captureEmailChallenge(request) {
        const result = await inbox.captureEmailChallenge(request);
        if (result?.handle?.schema !== "pookakind.stewart-private-inbox-email-otp-handle/v1" || !HASH.test(result.handle.ref_sha256 ?? "")) fail("STEWART_DISNEY_PROVIDER_OTP_INVALID");
        otpHandle = result.handle; return result;
      },
    }),
    challenge: Object.freeze({ submitEmailChallenge: async () => execute("challenge") }),
    passwordChange: Object.freeze({ submitPasswordChange: async () => execute("passwordChange") }),
    session: Object.freeze({
      async clearOwnedSession() {
        return providerAdapter.signOutAndClear({ session_ref_sha256, provider_id: "DISNEY_MYDISNEY" });
      },
    }),
    freshSignIn: Object.freeze({
      submitFreshIdentity: async () => execute("freshIdentity"),
      submitFreshSignIn: async () => execute("freshSignIn"),
    }),
    vault,
  });
}
