#!/usr/bin/env node
import { closeSync, existsSync, openSync, readFileSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { runStewartGeneralizedNativeHostOperation } from "../../lib/harvey/stewart-generalized-native-host.mjs";

const MAX_FRAME = 64 * 1024;
const HASH = /^[a-f0-9]{64}$/;
const configPath = process.env.POOKAKIND_STEWART_GENERALIZED_OPERATION || join(process.env.LOCALAPPDATA ?? "", "PookaKind", "Stewart", "Generalized", "pending-operation.json");
const consumedRoot = process.env.POOKAKIND_STEWART_GENERALIZED_CONSUMED_ROOT
  || join(process.env.LOCALAPPDATA ?? "", "PookaKind", "Stewart", "Generalized", "consumed");
const helperPath = process.env.POOKAKIND_STEWART_HANDLE_RESOLVER || join(process.env.LOCALAPPDATA ?? "", "PookaKind", "Stewart", "Generalized", "PookaKindStewartHandleResolver.exe");

async function* frames(stream) {
  let pending = Buffer.alloc(0);
  for await (const chunk of stream) {
    pending = Buffer.concat([pending, chunk]);
    while (pending.length >= 4) {
      const length = pending.readUInt32LE(0);
      if (length < 2 || length > MAX_FRAME) throw new Error("STEWART_NATIVE_FRAME_INVALID");
      if (pending.length < length + 4) break;
      yield JSON.parse(pending.subarray(4, length + 4).toString("utf8"));
      pending = pending.subarray(length + 4);
    }
  }
  if (pending.length !== 0) throw new Error("STEWART_NATIVE_FRAME_TRUNCATED");
}
function write(value) {
  const payload = Buffer.from(JSON.stringify(value), "utf8");
  if (payload.length < 2 || payload.length > MAX_FRAME) throw new Error("STEWART_NATIVE_RESPONSE_INVALID");
  const prefix = Buffer.alloc(4); prefix.writeUInt32LE(payload.length, 0); process.stdout.write(prefix); process.stdout.write(payload);
}
function exact(value, keys, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(code);
  const actual = Object.keys(value).sort(); const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) throw new Error(code);
}
function resolve(handle, entry) {
  if (!existsSync(helperPath) || entry.ref_sha256 !== handle.ref_sha256 || !HASH.test(entry.ref_sha256 ?? "")) throw new Error("STEWART_NATIVE_HANDLE_CUSTODY_CONFLICT");
  const result = spawnSync(helperPath, ["--handle", entry.handle_name, "--path", entry.dpapi_path], { windowsHide: true, encoding: null, maxBuffer: 8192 });
  if (result.status !== 0 || !Buffer.isBuffer(result.stdout) || result.stdout.length < 5) throw new Error("STEWART_NATIVE_HANDLE_RESOLUTION_FAILED");
  const length = result.stdout.readUInt32LE(0); if (length < 1 || length > 4096 || result.stdout.length !== length + 4) throw new Error("STEWART_NATIVE_HANDLE_RESOLUTION_FAILED");
  const material = result.stdout.subarray(4).toString("utf8"); result.stdout.fill(0); return { resolved: true, material };
}

try {
  const origin = process.argv[2] ?? ""; const match = /^chrome-extension:\/\/([a-p]{32})\/$/.exec(origin);
  if (!match) throw new Error("STEWART_NATIVE_EXTENSION_ORIGIN_INVALID");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  exact(config, ["authority_record", "descriptor", "extension_id_sha256", "handles", "operator_authority", "schema"], "STEWART_NATIVE_CONFIG_INVALID");
  if (config.schema !== "pookakind.stewart-generalized-native-host-config/v1" || !Array.isArray(config.handles) || config.handles.length < 1 || config.handles.length > 6) throw new Error("STEWART_NATIVE_CONFIG_INVALID");
  const iterator = frames(process.stdin)[Symbol.asyncIterator]();
  const next = async () => { const item = await iterator.next(); if (item.done) throw new Error("STEWART_NATIVE_PORT_DISCONNECTED"); return item.value; };
  const bootstrap = await next();
  exact(bootstrap, ["canonical_origin_sha256", "extension_id_sha256", "route_epoch_sha256", "schema", "tab_id_sha256"], "STEWART_NATIVE_BOOTSTRAP_INVALID");
  if (bootstrap.schema !== "pookakind.stewart-extension-bootstrap/v1" || bootstrap.extension_id_sha256 !== config.extension_id_sha256) throw new Error("STEWART_NATIVE_BOOTSTRAP_INVALID");
  const authority = config.authority_record.payload;
  const observedAt = new Date().toISOString();
  const result = await runStewartGeneralizedNativeHostOperation({
    authorityRecord: config.authority_record, operatorAuthority: config.operator_authority,
    descriptor: config.descriptor, extension_id_sha256: config.extension_id_sha256,
    handles: config.handles.map((entry) => ({ schema: authority.operation_kind === "EMAIL_OTP_SUBMIT" ? "pookakind.stewart-private-inbox-email-otp-handle/v1" : "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: entry.ref_sha256 })),
    observeExtension: async (descriptor) => {
      write({ schema: "pookakind.stewart-extension-describe/v1", descriptor }); const response = await next();
      if (response.schema !== "pookakind.stewart-extension-dom-observation/v1") throw new Error("STEWART_NATIVE_OBSERVATION_INVALID");
      return { schema: "pookakind.stewart-background-credential-observation/v1", account_ref_sha256: authority.account_ref_sha256, canonical_origin_sha256: bootstrap.canonical_origin_sha256, route_epoch_sha256: bootstrap.route_epoch_sha256, tab_id_sha256: bootstrap.tab_id_sha256, form_sha256: authority.form_sha256, field_controls: response.field_controls, final_control_sha256: response.final_control_sha256, final_control_count: 1, final_control_enabled: true, unexpected_field_count: response.unexpected_field_count, secret_material_present: response.secret_material_present, provider_response_contract_sha256: authority.provider_response_contract_sha256, observed_at: observedAt };
    },
    executeExtension: async ({ descriptor, fields }) => { write({ schema: "pookakind.stewart-extension-execute-fields/v1", descriptor, fields }); return next(); },
    readExtension: async (descriptor) => { write({ schema: "pookakind.stewart-extension-readback-request/v1", descriptor }); return next(); },
    consume: async (operation) => { await mkdir(consumedRoot, { recursive: true }); let fd; try { fd = openSync(join(consumedRoot, `${operation}.used`), "wx", 0o600); return true; } catch (error) { if (error?.code === "EEXIST") return false; throw error; } finally { if (fd !== undefined) closeSync(fd); } },
    resolveHandle: async (handle) => { const entry = config.handles.find((item) => item.ref_sha256 === handle.ref_sha256); if (!entry) throw new Error("STEWART_NATIVE_HANDLE_NOT_FOUND"); return resolve(handle, entry); },
  });
  write(result);
} catch (error) {
  process.stderr.write(`${String(error?.code || error?.message || "STEWART_GENERALIZED_NATIVE_HOST_FAILED_CLOSED")}\n`); process.exitCode = 1;
}
