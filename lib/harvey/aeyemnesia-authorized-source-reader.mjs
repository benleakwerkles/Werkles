import { open, lstat, realpath } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { types } from "node:util";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fail = (code) => { throw new Error(code); };
const SHA = /^[a-f0-9]{64}$/;
export function snapshotAeyemnesiaSourceInput(value, depth = 0, seen = new Set(), budget = { nodes: 0, bytes: 0 }) {
  if (++budget.nodes > 16384) fail("SOURCE_INPUT_BUDGET_EXCEEDED");
  if (typeof value === "string") budget.bytes += Buffer.byteLength(value);
  if (budget.bytes > 4 * 1024 * 1024) fail("SOURCE_INPUT_BUDGET_EXCEEDED");
  if (depth > 32) fail("SOURCE_INPUT_UNSAFE");
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (!value || typeof value !== "object" || types.isProxy(value)) fail("SOURCE_INPUT_UNSAFE");
  if (seen.has(value)) fail("SOURCE_INPUT_UNSAFE");
  seen.add(value);
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) fail("SOURCE_INPUT_UNSAFE");
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(descriptors).some(key => typeof key !== "string")) fail("SOURCE_INPUT_UNSAFE");
  if (Object.keys(descriptors).length > 4096) fail("SOURCE_INPUT_UNSAFE");
  const result = Array.isArray(value) ? [] : {};
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (Array.isArray(value) && key === "length") continue;
    if (!Object.hasOwn(descriptor, "value") || key === "__proto__") fail("SOURCE_INPUT_UNSAFE");
    budget.bytes += Buffer.byteLength(key);
    result[key] = snapshotAeyemnesiaSourceInput(descriptor.value, depth + 1, seen, budget);
  }
  if (Array.isArray(value) && result.length !== value.length) fail("SOURCE_INPUT_UNSAFE");
  if (Array.isArray(value) && Object.keys(result).length !== value.length) fail("SOURCE_INPUT_UNSAFE");
  seen.delete(value);
  return Object.freeze(result);
}
export const hashAuthorizedSourceManifest = (manifest) => sha(JSON.stringify(manifest));

/** One-shot, explicitly allowlisted retrieval. Hash verification is not source authority or proof of use. */
export async function readAuthorizedAeyemnesiaSourcesOnce(request) {
  const { root, manifest, trusted_manifest_sha256, expected_binding } = snapshotAeyemnesiaSourceInput(request);
  if (!path.isAbsolute(root ?? "")) fail("SOURCE_ROOT_ABSOLUTE_REQUIRED");
  if (!expected_binding || expected_binding.root !== path.resolve(root)
    || expected_binding.work_object_id !== manifest?.work_object_id
    || expected_binding.receiver_ref !== manifest?.receiver_ref
    || expected_binding.manifest_sha256 !== trusted_manifest_sha256) fail("SOURCE_EXPECTED_BINDING_CONFLICT");
  if (!SHA.test(trusted_manifest_sha256 ?? "") || hashAuthorizedSourceManifest(manifest) !== trusted_manifest_sha256) fail("SOURCE_MANIFEST_PIN_CONFLICT");
  if (manifest?.schema !== "werkles.aeyemnesia-authorized-source-manifest/v1"
    || typeof manifest.work_object_id !== "string" || !manifest.work_object_id
    || typeof manifest.receiver_ref !== "string" || !manifest.receiver_ref
    || !Array.isArray(manifest.sources) || !manifest.sources.length || manifest.sources.length > 32) fail("SOURCE_MANIFEST_INVALID");
  const base = path.resolve(root);
  const rootStat = await lstat(base);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink() || await realpath(base) !== base) fail("SOURCE_ROOT_UNSAFE");
  const ids = new Set(); const paths = new Set(); const result = []; let total = 0;
  for (const source of manifest.sources) {
    if (!source || !/^[A-Za-z0-9._-]{1,192}$/.test(source.source_id ?? "") || ids.has(source.source_id)
      || !SHA.test(source.sha256 ?? "") || !["MISSION", "TOOL", "FACT", "CORRECTION"].includes(source.kind)
      || typeof source.relative_path !== "string" || !/^[A-Za-z0-9_./-]+$/.test(source.relative_path)
      || source.relative_path.split("/").some((part) => !part || part === "." || part === "..")
      || paths.has(source.relative_path.toLowerCase())) fail("SOURCE_ENTRY_INVALID");
    ids.add(source.source_id); paths.add(source.relative_path.toLowerCase());
    const parts = source.relative_path.split("/"); let current = base;
    for (const part of parts) {
      current = path.join(current, part);
      const stat = await lstat(current);
      if (stat.isSymbolicLink() || await realpath(current) !== current) fail("SOURCE_PATH_UNSAFE");
    }
    const handle = await open(current, "r");
    let bytes;
    try {
      const stat = await handle.stat();
      if (!stat.isFile() || stat.size > 1024 * 1024 || total + stat.size > 4 * 1024 * 1024) fail("SOURCE_SIZE_OR_TYPE_INVALID");
      bytes = await handle.readFile();
      if (bytes.length > 1024 * 1024 || total + bytes.length > 4 * 1024 * 1024) fail("SOURCE_SIZE_OR_TYPE_INVALID");
      const currentStat = await lstat(current);
      if (currentStat.isSymbolicLink() || await realpath(current) !== current
        || currentStat.dev !== stat.dev || currentStat.ino !== stat.ino) fail("SOURCE_OPEN_PATH_CUSTODY_CONFLICT");
    } finally { await handle.close(); }
    if (sha(bytes) !== source.sha256) fail("SOURCE_BYTES_HASH_CONFLICT");
    total += bytes.length;
    result.push({ source_id: source.source_id, kind: source.kind, relative_path: source.relative_path,
      sha256: source.sha256, bytes_base64: bytes.toString("base64"), byte_length: bytes.length });
  }
  return { schema: "werkles.aeyemnesia-authorized-source-retrieval/v1", work_object_id: manifest.work_object_id,
    receiver_ref: manifest.receiver_ref, manifest_sha256: trusted_manifest_sha256, sources: result,
    source_bytes_retrieved: true, successor_use_proved: false, authority_created: false, recurring_operation_created: false };
}
