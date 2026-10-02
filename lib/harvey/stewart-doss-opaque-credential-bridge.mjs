import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

import { canonicalJson } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const PROVIDER = /^[A-Z][A-Z0-9_]{2,63}$/;
const HANDLE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const ACTIONS = new Set(["SIGN_IN", "PASSWORD_RESET"]);
const ROLES = new Set(["CURRENT_PASSWORD", "NEW_PASSWORD", "CONFIRM_PASSWORD"]);
const BINDING_FIELDS = ["dpapi_path", "handle_name", "ref_sha256", "schema"];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.getOwnPropertySymbols(value).length) fail(code);
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
}
function contained(root, candidate) {
  const path = realpathSync(resolve(candidate)); const rel = relative(root, path);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) fail("STEWART_DOSS_CREDENTIAL_PATH_ESCAPE");
  return path;
}

/** Resolves only exact, previously bound local DPAPI handles. No secret is logged or serialized into receipts. */
export function createDossOpaqueCredentialHandleResolver({ resolver_executable, allowed_root, bindings, run = spawnSync }) {
  if (typeof run !== "function" || typeof resolver_executable !== "string" || typeof allowed_root !== "string" || !Array.isArray(bindings) || bindings.length < 1 || bindings.length > 8) fail("STEWART_DOSS_CREDENTIAL_RESOLVER_INPUT_INVALID");
  const root = realpathSync(resolve(allowed_root)); const executable = realpathSync(resolve(resolver_executable));
  const byRef = new Map();
  for (const binding of bindings) {
    exact(binding, BINDING_FIELDS, "STEWART_DOSS_CREDENTIAL_BINDING_INVALID");
    if (binding.schema !== "pookakind.stewart-doss-opaque-credential-binding/v1" || !HASH.test(binding.ref_sha256 ?? "") || !HANDLE_NAME.test(binding.handle_name ?? "") || typeof binding.dpapi_path !== "string") fail("STEWART_DOSS_CREDENTIAL_BINDING_INVALID");
    if (byRef.has(binding.ref_sha256)) fail("STEWART_DOSS_CREDENTIAL_BINDING_DUPLICATE");
    byRef.set(binding.ref_sha256, Object.freeze({ handle_name: binding.handle_name, dpapi_path: contained(root, binding.dpapi_path) }));
  }
  return async (handle) => {
    exact(handle, ["ref_sha256", "schema"], "STEWART_DOSS_CREDENTIAL_HANDLE_INVALID");
    if (handle.schema !== "pookakind.stewart-opaque-credential-handle/v1" || !HASH.test(handle.ref_sha256 ?? "")) fail("STEWART_DOSS_CREDENTIAL_HANDLE_INVALID");
    const binding = byRef.get(handle.ref_sha256); if (!binding) fail("STEWART_DOSS_CREDENTIAL_HANDLE_NOT_BOUND");
    const result = run(executable, ["--handle", binding.handle_name, "--path", binding.dpapi_path], { windowsHide: true, encoding: null, maxBuffer: 8192 });
    const stdout = result?.stdout;
    try {
      if (result?.status !== 0 || !Buffer.isBuffer(stdout) || stdout.length < 5) fail("STEWART_DOSS_CREDENTIAL_RESOLUTION_FAILED");
      const length = stdout.readUInt32LE(0);
      if (length < 1 || length > 4096 || stdout.length !== length + 4) fail("STEWART_DOSS_CREDENTIAL_RESOLUTION_FAILED");
      return { resolved: true, material: stdout.subarray(4).toString("utf8") };
    } finally { if (Buffer.isBuffer(stdout)) stdout.fill(0); }
  };
}

/** A local handle is released only for a matching, already-verified stage command. */
export function createDossImportedCredentialBridge({ resolver_executable, allowed_root, provider_id, canonical_origin_sha256, operation_sha256, account_ref_sha256, action, role, handle_name, run = spawnSync }) {
  if (!PROVIDER.test(provider_id ?? "") || ![canonical_origin_sha256, operation_sha256, account_ref_sha256].every((value) => HASH.test(value ?? ""))
    || !ACTIONS.has(action) || !ROLES.has(role) || !HANDLE_NAME.test(handle_name ?? "")
    || (action === "SIGN_IN" && role !== "CURRENT_PASSWORD")
    || (action === "PASSWORD_RESET" && role === "CURRENT_PASSWORD")) fail("STEWART_DOSS_CREDENTIAL_BRIDGE_INPUT_INVALID");
  const root = realpathSync(resolve(allowed_root));
  const dpapiPath = contained(root, join(root, `${handle_name}.dpapi`));
  if (relative(root, dpapiPath) !== `${handle_name}.dpapi`) fail("STEWART_DOSS_CREDENTIAL_PATH_ESCAPE");
  const ref_sha256 = createHash("sha256").update(canonicalJson([
    "pookakind.stewart-imported-credential/v1", provider_id, canonical_origin_sha256,
    operation_sha256, account_ref_sha256, action, role, handle_name,
  ])).digest("hex");
  const handle = Object.freeze({ schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256 });
  const resolve_handle = createDossOpaqueCredentialHandleResolver({ resolver_executable, allowed_root: root,
    bindings: [{ schema: "pookakind.stewart-doss-opaque-credential-binding/v1", ref_sha256, handle_name, dpapi_path: dpapiPath }], run });
  function authorize_stage({ provider_id: observedProvider, stage, command }) {
    const permitted = action === "PASSWORD_RESET"
      ? { passwordChange: { kind: "PASSWORD_RESET", roles: ["NEW_PASSWORD", "CONFIRM_PASSWORD"] }, freshSignIn: { kind: "SIGN_IN", roles: ["CURRENT_PASSWORD"] } }
      : { freshSignIn: { kind: "SIGN_IN", roles: ["CURRENT_PASSWORD"] } };
    const rule = Object.hasOwn(permitted, stage) ? permitted[stage] : null;
    if (!rule || observedProvider !== provider_id || !command || typeof command !== "object"
      || command.schema !== "pookakind.stewart-background-credential-command/v1"
      || command.operation_kind !== rule.kind || command.account_ref_sha256 !== account_ref_sha256
      || command.canonical_origin_sha256 !== canonical_origin_sha256
      || command.operation_id_sha256 !== createHash("sha256").update(canonicalJson([operation_sha256, stage])).digest("hex")
      || command.max_uses !== 1 || !Array.isArray(command.fields)
      || canonicalJson(command.fields.filter((field) => field?.handle_ref_sha256 === ref_sha256).map((field) => field.role)) !== canonicalJson(rule.roles)) {
      fail("STEWART_DOSS_CREDENTIAL_STAGE_SCOPE_INVALID");
    }
    return true;
  }
  async function resolve_for_stage({ provider_id: observedProvider, stage, command, handle: requestedHandle }) {
    authorize_stage({ provider_id: observedProvider, stage, command });
    exact(requestedHandle, ["ref_sha256", "schema"], "STEWART_DOSS_CREDENTIAL_STAGE_HANDLE_INVALID");
    if (requestedHandle.schema !== handle.schema || requestedHandle.ref_sha256 !== handle.ref_sha256) fail("STEWART_DOSS_CREDENTIAL_STAGE_HANDLE_INVALID");
    return resolve_handle(requestedHandle);
  }
  return Object.freeze({ handle, authorize_stage, resolve_for_stage, receipt: Object.freeze({ schema: "pookakind.stewart-doss-imported-credential-bridge/v1",
    state: "EXACT_LOCAL_HANDLE_BOUND_NOT_USED", provider_id, canonical_origin_sha256, operation_sha256,
    account_ref_sha256, action, role, handle_ref_sha256: ref_sha256, provider_contacted: false, secret_material_output: false }) });
}
