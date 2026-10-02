import { createHash } from "node:crypto";

import { compileStewartBackgroundCredentialOperation, runStewartBackgroundCredentialOperation } from "./stewart-background-credential-operation.mjs";
import { createStewartGeneralizedExtensionBridgeSession } from "./stewart-generalized-extension-bridge.mjs";
import { canonicalJson } from "./station-crypto-core.mjs";

const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const fail = (code) => { const error = new Error(code); error.code = code; throw error; };

export async function runStewartGeneralizedNativeHostOperation({
  authorityRecord, operatorAuthority, descriptor, extension_id_sha256, handles,
  observeExtension, executeExtension, readExtension, consume, resolveHandle,
  now = () => Date.now(), randomBytes,
}) {
  if (typeof observeExtension !== "function" || typeof executeExtension !== "function"
    || typeof readExtension !== "function" || typeof consume !== "function"
    || typeof resolveHandle !== "function" || typeof now !== "function") fail("STEWART_GENERALIZED_NATIVE_HOST_DEPENDENCY_INVALID");
  const observed = await observeExtension(structuredClone(descriptor));
  const compiled = compileStewartBackgroundCredentialOperation({ authorityRecord, operatorAuthority, observation: observed, now: now() });
  const admission = compiled.admission;
  if (admission.decision !== "EXECUTE_ONCE") {
    return Object.freeze({ schema: "pookakind.stewart-generalized-native-host-receipt/v1", state: "PREPARED_NOT_ACTIVATED", fixed: false, password_conversion: false, secret_material_returned: false, recurring_operation_created: false });
  }
  const session = createStewartGeneralizedExtensionBridgeSession({
    command: admission.command, extension_id_sha256, descriptor,
    expires_at: authorityRecord.payload.expires_at, now, ...(randomBytes ? { randomBytes } : {}),
  });
  session.acceptObservation({
    schema: "pookakind.stewart-extension-observation/v1", sequence: 0,
    scope: structuredClone(session.scope),
    field_controls_sha256: digest(descriptor.field_descriptors.map(({ role, control_sha256 }) => ({ role, control_sha256 }))),
    final_control_sha256: admission.command.final_control_sha256,
    foreground_unchanged: true, unexpected_field_count: 0,
  });
  const result = await runStewartBackgroundCredentialOperation({
    compiled, handles, consume, resolveHandle,
    executeBackgroundForm: async ({ field_material }) => {
      await session.transmitFieldsOnce({
        field_material,
        send: async (frame) => {
          const receipt = await executeExtension({ descriptor: structuredClone(descriptor), fields: frame.fields });
          return {
            schema: "pookakind.stewart-extension-execution-receipt/v1", sequence: 2,
            scope: structuredClone(session.scope), field_count: receipt.field_count,
            field_roles_sha256: digest(receipt.field_roles),
            final_control_invoked: receipt.final_control_invoked,
            foreground_changed: receipt.foreground_changed,
            input_devices_touched: receipt.input_devices_touched,
            secret_material_exposed: receipt.secret_material_exposed,
          };
        },
      });
      return {
        field_count: admission.command.fields.length,
        field_roles_sha256: digest(admission.command.fields.map(({ role }) => role)),
        final_control_count: 1, final_control_invoked: true, foreground_changed: false,
        cursor_touched: false, keyboard_touched: false, clipboard_touched: false,
        secret_material_exposed: false,
      };
    },
    readback: async (command) => {
      const bridgeReceipt = await session.requestReadback(async () => {
        const receipt = await readExtension(structuredClone(descriptor));
        return {
          schema: "pookakind.stewart-extension-provider-readback/v1", sequence: 4,
          scope: structuredClone(session.scope), response_contract_sha256: command.provider_response_contract_sha256,
          provider_state_sha256: digest(receipt), response_class: receipt.response_class,
        };
      });
      return {
        schema: "pookakind.stewart-background-credential-provider-readback/v1",
        request_sha256: command.request_sha256, tab_id_sha256: command.tab_id_sha256,
        canonical_origin_sha256: command.canonical_origin_sha256,
        route_epoch_sha256: command.route_epoch_sha256,
        provider_response_contract_sha256: command.provider_response_contract_sha256,
        provider_state_sha256: bridgeReceipt.provider_state_sha256,
        response_class: bridgeReceipt.response_class,
      };
    },
  });
  return Object.freeze({ schema: "pookakind.stewart-generalized-native-host-receipt/v1", state: result.state, provider_state_sha256: result.provider_state_sha256, fixed: false, password_conversion: false, secret_material_returned: false, recurring_operation_created: false });
}
