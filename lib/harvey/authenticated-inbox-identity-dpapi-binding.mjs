import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";

import { createAuthenticatedInboxIdentityHandle } from "./authenticated-inbox-identity-handle.mjs";

const HANDLE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const HASH = /^[a-f0-9]{64}$/;

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) { if (!value || typeof value !== "object" || Array.isArray(value)) fail(code); const actual = Object.keys(value).sort(); const expected = [...fields].sort(); if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) fail(code); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }

function defaultProtect({ resolver_path, handle_name, dpapi_path, frame }) {
  return spawnSync(resolver_path, ["--protect-stdin", "--handle", handle_name, "--path", dpapi_path], { input: frame, encoding: "buffer", windowsHide: true, maxBuffer: 16 * 1024 });
}

export function createDpapiSecretHandleWriter({ resolver_path, local_app_data = process.env.LOCALAPPDATA, run_protect = defaultProtect }) {
  if (typeof resolver_path !== "string" || !resolver_path || typeof local_app_data !== "string" || !local_app_data || typeof run_protect !== "function") fail("STEWART_DPAPI_WRITER_INPUT_INVALID");
  const root = resolve(local_app_data, "PookaKind", "Stewart", "SecretHandles");
  mkdirSync(root, { recursive: true });
  return ({ handle_name, material }) => {
    if (!HANDLE_NAME.test(handle_name ?? "") || typeof material !== "string" || material.length < 1 || Buffer.byteLength(material, "utf8") > 4096) fail("STEWART_DPAPI_WRITER_MATERIAL_INVALID");
    const dpapiPath = resolve(root, `${handle_name}.dpapi`);
    if (!dpapiPath.startsWith(`${root}${sep}`)) fail("STEWART_DPAPI_WRITER_PATH_INVALID");
    const materialBytes = Buffer.from(material, "utf8");
    const frame = Buffer.allocUnsafe(4 + materialBytes.length);
    frame.writeInt32LE(materialBytes.length, 0); materialBytes.copy(frame, 4);
    materialBytes.fill(0);
    let result;
    try { result = run_protect({ resolver_path, handle_name, dpapi_path: dpapiPath, frame }); }
    finally { frame.fill(0); }
    const stdout = Buffer.isBuffer(result?.stdout) ? result.stdout.toString("utf8").trim() : String(result?.stdout ?? "").trim();
    const stderr = Buffer.isBuffer(result?.stderr) ? result.stderr.toString("utf8").trim() : String(result?.stderr ?? "").trim();
    if (result?.status !== 0 || stdout !== "STEWART_HANDLE_PROTECTED_ONCE" || stderr) fail("STEWART_DPAPI_WRITER_FAILED_CLOSED");
    const sealed = readFileSync(dpapiPath);
    if (sealed.length < 32 || sealed.length > 8192) fail("STEWART_DPAPI_WRITER_OUTPUT_INVALID");
    return Object.freeze({ schema: "pookakind.stewart-dpapi-secret-handle-binding/v1", handle_name, dpapi_path: dpapiPath, sealed_sha256: sha256(sealed), material_output: false, max_uses: 1 });
  };
}

export async function bindAuthenticatedInboxIdentityToDpapi(rawInput, dependencies = {}) {
  exact(rawInput, ["account_ref_sha256", "handle_name", "mailbox_provider", "provider_id", "read_authenticated_mailbox_identity", "route_epoch_sha256"], "AUTHENTICATED_INBOX_IDENTITY_DPAPI_INPUT_INVALID");
  const writer = createDpapiSecretHandleWriter(dependencies);
  const identity = await createAuthenticatedInboxIdentityHandle({ provider_id: rawInput.provider_id, account_ref_sha256: rawInput.account_ref_sha256, route_epoch_sha256: rawInput.route_epoch_sha256, mailbox_provider: rawInput.mailbox_provider, read_authenticated_mailbox_identity: rawInput.read_authenticated_mailbox_identity }, dependencies);
  const resolved = await identity.resolve_handle(identity.handle);
  let material = resolved.material;
  try {
    const binding = writer({ handle_name: rawInput.handle_name, material });
    if (!HASH.test(identity.handle.ref_sha256)) fail("AUTHENTICATED_INBOX_IDENTITY_DPAPI_HANDLE_INVALID");
    return Object.freeze({
      handle: identity.handle,
      binding,
      receipt: Object.freeze({ schema: "pookakind.authenticated-inbox-identity-dpapi-receipt/v1", state: "AUTHENTICATED_MAILBOX_IDENTITY_DPAPI_READY", provider_id: rawInput.provider_id, account_ref_sha256: rawInput.account_ref_sha256, route_epoch_sha256: rawInput.route_epoch_sha256, handle_ref_sha256: identity.handle.ref_sha256, sealed_sha256: binding.sealed_sha256, max_uses: 1, identity_material_output: false, mailbox_content_output: false, secret_material_output: false }),
    });
  } finally { material = null; resolved.material = null; }
}
