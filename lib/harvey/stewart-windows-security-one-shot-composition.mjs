import { compileStewartWindowsSecurityUiAccessOperation } from "./stewart-windows-security-uiaccess-operation.mjs";

const HASH = /^[a-f0-9]{64}$/;

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exactData(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) fail(code);
  const keys = Reflect.ownKeys(value); const expected = [...fields].sort();
  if (keys.some((key) => typeof key !== "string") || keys.length !== expected.length) fail(code);
  const actual = keys.map(String).sort();
  for (let index = 0; index < actual.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, actual[index]);
    if (actual[index] !== expected[index] || !descriptor?.enumerable || !("value" in descriptor)) fail(code);
  }
}
function exactCallable(value, fields, code) {
  exactData(value, fields, code);
  return Object.fromEntries(fields.map((field) => {
    const method = Object.getOwnPropertyDescriptor(value, field)?.value;
    if (typeof method !== "function") fail(code);
    return [field, method.bind(value)];
  }));
}
function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

export function composeStewartWindowsSecurityOneShot(rawInput) {
  exactData(rawInput, ["authority", "authority_record", "expected_machine_sha256", "lifecycle", "sealed_store"], "STEWART_WINDOWS_SECURITY_COMPOSITION_INPUT_INVALID");
  if (!HASH.test(rawInput.expected_machine_sha256 ?? "")) fail("STEWART_WINDOWS_SECURITY_COMPOSITION_MACHINE_INVALID");
  const store = exactCallable(rawInput.sealed_store, ["seal_once"], "STEWART_WINDOWS_SECURITY_COMPOSITION_STORE_INVALID");
  const lifecycle = exactCallable(rawInput.lifecycle, ["run_once"], "STEWART_WINDOWS_SECURITY_COMPOSITION_LIFECYCLE_INVALID");
  let consumed = false;

  return Object.freeze({
    async run_once(now = Date.now()) {
      if (consumed) fail("STEWART_WINDOWS_SECURITY_COMPOSITION_ALREADY_CONSUMED");
      consumed = true;
      const command = compileStewartWindowsSecurityUiAccessOperation({
        authority: rawInput.authority,
        authority_record: rawInput.authority_record,
        expected_machine_sha256: rawInput.expected_machine_sha256,
        now,
      });
      const sealed = store.seal_once(command);
      exactData(sealed, ["path", "state"], "STEWART_WINDOWS_SECURITY_COMPOSITION_SEAL_INVALID");
      if (!(["SEALED_ONCE", "EXACT_REPLAY"].includes(sealed.state)) || typeof sealed.path !== "string" || !sealed.path.endsWith(`${command.operation_id_sha256}.signing-draft.json`)) fail("STEWART_WINDOWS_SECURITY_COMPOSITION_SEAL_INVALID");
      const terminal = await lifecycle.run_once(freeze({
        schema: "pookakind.stewart-windows-security-internal-lifecycle-request/v1",
        operation_id_sha256: command.operation_id_sha256,
        sealed_operation_draft_path: sealed.path,
        max_uses: 1,
      }));
      exactData(terminal, ["activation_driver_sha256", "approval_scope_sha256", "failure", "fixed", "installed", "live_callable", "operation_id_sha256", "package_sha256", "provider_outcome", "recurrence_created", "residual_owned_certificate_count", "residual_owned_process_count", "rollback_verified", "schema", "sealed_operation_state", "secret_accessed", "secret_material_exposed", "state", "synthetic_state", "windows_security_opened"], "STEWART_WINDOWS_SECURITY_COMPOSITION_TERMINAL_INVALID");
      if (terminal.schema !== "pookakind.stewart-windows-security-uiaccess-elevated-lifecycle-terminal/v1"
        || terminal.state !== "SEALED_OPERATION_SUBMITTED_ROLLED_BACK"
        || terminal.operation_id_sha256 !== command.operation_id_sha256
        || terminal.sealed_operation_state !== "SUBMITTED_ONCE_AWAITING_PROVIDER_READBACK"
        || terminal.windows_security_opened !== true
        || terminal.secret_material_exposed !== false
        || terminal.provider_outcome !== "OUTCOME_UNPROVEN"
        || terminal.rollback_verified !== true
        || terminal.installed !== false
        || terminal.residual_owned_certificate_count !== 0
        || terminal.residual_owned_process_count !== 0
        || terminal.live_callable !== false
        || terminal.secret_accessed !== true
        || terminal.recurrence_created !== false
        || terminal.failure !== null
        || terminal.fixed !== false) fail("STEWART_WINDOWS_SECURITY_COMPOSITION_TERMINAL_INVALID");
      return freeze({
        schema: "pookakind.stewart-windows-security-one-shot-receipt/v1",
        state: "SUBMITTED_ONCE_AWAITING_PROVIDER_READBACK__ROLLED_BACK",
        operation_id_sha256: command.operation_id_sha256,
        provider_outcome: "OUTCOME_UNPROVEN",
        secret_material_exposed: false,
        cursor_keyboard_clipboard_touched: false,
        foreground_changed: false,
        rollback_verified: true,
        fixed: false,
      });
    },
  });
}
