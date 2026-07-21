import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";

const RELEASE_SCHEMA = "werkles.harvey-book-loop-release/v0";
const RESULT_SCHEMA = "werkles.harvey-book-loop-router-result/v0";
const RECEIPT_SCHEMA = "werkles.harvey-book-loop-transition-receipt/v0";
const HASH_ALGORITHM = "SHA256_LF_UTF8_V1";
const MAX_CONTROL_BYTES = 1024 * 1024;
const LOCK_PATH = "foreman/harvey/book-loop/.router-lock";
const HEX_256 = /^[a-f0-9]{64}$/;
const PACKET_ID = /^[A-Z0-9][A-Z0-9_]{2,159}$/;

export class BookLoopRouterError extends Error {
  constructor(code, exitCode = 2) {
    super(code);
    this.name = "BookLoopRouterError";
    this.code = code;
    this.exitCode = exitCode;
  }
}

function fail(code, exitCode = 2) {
  throw new BookLoopRouterError(code, exitCode);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, expected, code) {
  if (!isPlainObject(value)) fail(code);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) fail(code);
}

function requiredString(value, code, max = 512) {
  if (typeof value !== "string" || !value.trim() || Buffer.byteLength(value, "utf8") > max) fail(code);
  return value;
}

function requiredHash(value, code) {
  if (typeof value !== "string" || !HEX_256.test(value)) fail(code);
  return value;
}

export function normalizeLfUtf8(buffer) {
  if (!Buffer.isBuffer(buffer)) fail("BOOK_LOOP_INTERNAL_BUFFER_REQUIRED", 4);
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    fail("BOOK_LOOP_UTF8_BOM_FORBIDDEN");
  }
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    fail("BOOK_LOOP_INVALID_UTF8");
  }
  return Buffer.from(text.replace(/\r\n?/g, "\n"), "utf8");
}

export function sha256LfUtf8(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input), "utf8");
  return createHash("sha256").update(normalizeLfUtf8(buffer)).digest("hex");
}

function safeRelativePath(value, code) {
  requiredString(value, code, 300);
  if (!/^[A-Za-z0-9._/-]+$/.test(value) || value.includes("\\") || value.includes("\0") || path.posix.isAbsolute(value)) fail(code);
  const normalized = path.posix.normalize(value);
  if (normalized !== value || value === "." || value.startsWith("../") || value.includes("/../")) fail(code);
  return value;
}

async function ensureDirectoriesNoLinks(root, relativeDirectory) {
  if (!relativeDirectory || relativeDirectory === ".") return;
  safeRelativePath(relativeDirectory, "BOOK_LOOP_DIRECTORY_PATH_INVALID");
  let current = path.resolve(root);
  for (const part of relativeDirectory.split("/")) {
    current = path.join(current, part);
    try {
      const stat = await fs.lstat(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) fail("BOOK_LOOP_DIRECTORY_LINK_FORBIDDEN");
    } catch (error) {
      if (error instanceof BookLoopRouterError) throw error;
      if (error?.code !== "ENOENT") fail("BOOK_LOOP_DIRECTORY_INSPECTION_FAILED", 4);
      try {
        await fs.mkdir(current);
      } catch (mkdirError) {
        if (mkdirError?.code !== "EEXIST") fail("BOOK_LOOP_DIRECTORY_CREATE_FAILED", 4);
      }
      const created = await fs.lstat(current).catch(() => null);
      if (!created?.isDirectory() || created.isSymbolicLink()) fail("BOOK_LOOP_DIRECTORY_LINK_FORBIDDEN");
    }
  }
}

function insideRoot(root, relativePath) {
  const absolute = path.resolve(root, ...relativePath.split("/"));
  const prefix = `${path.resolve(root)}${path.sep}`;
  const left = process.platform === "win32" ? absolute.toLowerCase() : absolute;
  const right = process.platform === "win32" ? prefix.toLowerCase() : prefix;
  if (!left.startsWith(right)) fail("BOOK_LOOP_PATH_OUTSIDE_MAILBOX");
  return absolute;
}

async function assertNoLinks(root, relativePath, { allowMissingLeaf = false, pointer = false, missingCode = "BOOK_LOOP_PATH_NOT_FOUND" } = {}) {
  const parts = relativePath.split("/");
  let current = path.resolve(root);
  for (let index = 0; index < parts.length; index += 1) {
    current = path.join(current, parts[index]);
    let stat;
    try {
      stat = await fs.lstat(current);
    } catch (error) {
      if (error?.code === "ENOENT" && allowMissingLeaf && index === parts.length - 1) return;
      fail(error?.code === "ENOENT" ? missingCode : "BOOK_LOOP_PATH_INSPECTION_FAILED", error?.code === "ENOENT" ? 2 : 4);
    }
    if (stat.isSymbolicLink()) fail("BOOK_LOOP_LINK_FORBIDDEN");
    if (pointer && index === parts.length - 1 && stat.nlink > 1) fail("BOOK_LOOP_POINTER_HARDLINK_FORBIDDEN");
  }
}

async function readBounded(root, relativePath, code) {
  await assertNoLinks(root, relativePath, { missingCode: code });
  const absolute = insideRoot(root, relativePath);
  let stat;
  try {
    stat = await fs.stat(absolute);
  } catch (error) {
    fail(error?.code === "ENOENT" ? code : "BOOK_LOOP_READ_FAILED", error?.code === "ENOENT" ? 2 : 4);
  }
  if (!stat.isFile() || stat.size > MAX_CONTROL_BYTES) fail(code);
  try {
    return await fs.readFile(absolute);
  } catch {
    fail("BOOK_LOOP_READ_FAILED", 4);
  }
}

function parseJson(buffer, code) {
  let value;
  try {
    value = JSON.parse(normalizeLfUtf8(buffer).toString("utf8"));
  } catch (error) {
    if (error instanceof BookLoopRouterError) throw error;
    fail(code);
  }
  return value;
}

function validateManifest(value) {
  exactKeys(value, ["schema", "manifest_id", "status", "hash_algorithm", "source", "destination", "pointer", "claim_boundary"], "BOOK_LOOP_MANIFEST_SCHEMA_INVALID");
  if (value.schema !== RELEASE_SCHEMA || value.status !== "READY_FOR_ROUTER" || value.hash_algorithm !== HASH_ALGORITHM) {
    fail("BOOK_LOOP_MANIFEST_SCHEMA_INVALID");
  }
  requiredString(value.manifest_id, "BOOK_LOOP_MANIFEST_ID_INVALID", 180);
  if (value.claim_boundary !== "POINTER_ADVANCEMENT_ONLY__NO_DELIVERY_OR_ACCEPTANCE_CLAIM") fail("BOOK_LOOP_CLAIM_BOUNDARY_INVALID");

  exactKeys(value.source, ["packet_id", "packet_path", "packet_sha256", "target", "return_path", "return_sha256", "terminal_marker"], "BOOK_LOOP_SOURCE_SCHEMA_INVALID");
  if (!PACKET_ID.test(value.source.packet_id)) fail("BOOK_LOOP_SOURCE_PACKET_ID_INVALID");
  safeRelativePath(value.source.packet_path, "BOOK_LOOP_SOURCE_PACKET_PATH_INVALID");
  requiredHash(value.source.packet_sha256, "BOOK_LOOP_SOURCE_PACKET_HASH_INVALID");
  requiredString(value.source.target, "BOOK_LOOP_SOURCE_TARGET_INVALID", 180);
  safeRelativePath(value.source.return_path, "BOOK_LOOP_RETURN_PATH_INVALID");
  requiredHash(value.source.return_sha256, "BOOK_LOOP_RETURN_HASH_INVALID");
  requiredString(value.source.terminal_marker, "BOOK_LOOP_TERMINAL_MARKER_INVALID", 80);
  if (value.source.terminal_marker !== "COMPLETED" && !/^BLOCKER: [A-Z0-9][A-Z0-9_:-]{0,63}$/.test(value.source.terminal_marker)) {
    fail("BOOK_LOOP_TERMINAL_MARKER_INVALID");
  }

  exactKeys(value.destination, ["packet_id", "packet_path", "packet_sha256", "target", "status", "authority"], "BOOK_LOOP_DESTINATION_SCHEMA_INVALID");
  if (!PACKET_ID.test(value.destination.packet_id)) fail("BOOK_LOOP_DESTINATION_PACKET_ID_INVALID");
  safeRelativePath(value.destination.packet_path, "BOOK_LOOP_DESTINATION_PACKET_PATH_INVALID");
  requiredHash(value.destination.packet_sha256, "BOOK_LOOP_DESTINATION_PACKET_HASH_INVALID");
  requiredString(value.destination.target, "BOOK_LOOP_DESTINATION_TARGET_INVALID", 180);
  requiredString(value.destination.status, "BOOK_LOOP_DESTINATION_STATUS_INVALID", 180);
  if (!/^SEALED__READY_FOR_[A-Z0-9_]{2,80}$/.test(value.destination.status)) fail("BOOK_LOOP_DESTINATION_NOT_SEALED");
  requiredString(value.destination.authority, "BOOK_LOOP_DESTINATION_AUTHORITY_INVALID", 300);

  exactKeys(value.pointer, ["path", "expected_sha256", "status", "transition_receipt_path"], "BOOK_LOOP_POINTER_SCHEMA_INVALID");
  safeRelativePath(value.pointer.path, "BOOK_LOOP_POINTER_PATH_INVALID");
  if (value.pointer.path !== "CURRENT_PACKET.md") fail("BOOK_LOOP_POINTER_PATH_INVALID");
  requiredHash(value.pointer.expected_sha256, "BOOK_LOOP_POINTER_HASH_INVALID");
  requiredString(value.pointer.status, "BOOK_LOOP_POINTER_STATUS_INVALID", 180);
  safeRelativePath(value.pointer.transition_receipt_path, "BOOK_LOOP_TRANSITION_RECEIPT_PATH_INVALID");

  if (value.source.packet_id === value.destination.packet_id) fail("BOOK_LOOP_PACKET_CONFLICT");
  if (value.source.packet_path === value.destination.packet_path) fail("BOOK_LOOP_PACKET_CONFLICT");
  return value;
}

function field(text, label, code) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...text.matchAll(new RegExp("^" + escaped + ": `([^`]+)`[ \\t]*$", "gm"))];
  if (matches.length !== 1) fail(code);
  return matches[0][1];
}

function plainField(text, label, code) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...text.matchAll(new RegExp("^" + escaped + ": ([^\\r\\n]+)[ \\t]*$", "gm"))];
  if (matches.length !== 1) fail(code);
  return matches[0][1].trim();
}

function parsePointer(buffer) {
  const text = normalizeLfUtf8(buffer).toString("utf8");
  return {
    text,
    status: field(text, "Status", "BOOK_LOOP_POINTER_FORMAT_INVALID"),
    target: field(text, "Target", "BOOK_LOOP_POINTER_FORMAT_INVALID"),
    packetId: field(text, "Packet ID", "BOOK_LOOP_POINTER_FORMAT_INVALID"),
    packetPath: field(text, "Packet path", "BOOK_LOOP_POINTER_FORMAT_INVALID"),
    packetHash: field(text, "Packet SHA-256", "BOOK_LOOP_POINTER_FORMAT_INVALID"),
    hashAlgorithm: text.includes("Hash Algorithm:") ? field(text, "Hash Algorithm", "BOOK_LOOP_POINTER_FORMAT_INVALID") : HASH_ALGORITHM
  };
}

function parsePacket(buffer) {
  const text = normalizeLfUtf8(buffer).toString("utf8");
  return {
    text,
    packetId: field(text, "Packet ID", "BOOK_LOOP_PACKET_FORMAT_INVALID"),
    status: field(text, "Status", "BOOK_LOOP_PACKET_FORMAT_INVALID"),
    target: field(text, "Target", "BOOK_LOOP_PACKET_FORMAT_INVALID"),
    authority: field(text, "Authority", "BOOK_LOOP_PACKET_FORMAT_INVALID")
  };
}

function lastNonemptyLine(buffer) {
  const lines = normalizeLfUtf8(buffer).toString("utf8").split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.at(-1) ?? "";
}

function renderPointer(manifest) {
  const destination = manifest.destination;
  return `# Current Harvey Builder Packet

Status: \`${manifest.pointer.status}\`  
Target: \`${destination.target}\`  
Packet ID: \`${destination.packet_id}\`  
Packet path: \`${destination.packet_path}\`  
Hash Algorithm: \`${HASH_ALGORITHM}\`  
Packet SHA-256: \`${destination.packet_sha256}\`  
Authority: \`${destination.authority}\`  
Transition manifest: \`${manifest.manifest_id}\`

## Intake

Read the packet at the exact path above and only the evidence it permits. Return
the packet's required \`RECEIVED\` readback before analysis or mutation. Perform
only the authority granted by that packet and write only its requested return.

\`SENT\`, pointer advancement, and artifact existence are not delivery,
incorporation, acceptance, effect, completion, outcome, or returned-time proof.
`;
}

function transitionReceipt(manifest, manifestHash, beforeHash, afterHash) {
  return {
    schema: RECEIPT_SCHEMA,
    manifest_id: manifest.manifest_id,
    manifest_sha256: manifestHash,
    source_packet_id: manifest.source.packet_id,
    source_return_path: manifest.source.return_path,
    source_return_sha256: manifest.source.return_sha256,
    destination_packet_id: manifest.destination.packet_id,
    destination_packet_path: manifest.destination.packet_path,
    destination_packet_sha256: manifest.destination.packet_sha256,
    pointer_path: manifest.pointer.path,
    pointer_before_sha256: beforeHash,
    pointer_after_sha256: afterHash,
    status: "POINTER_ADVANCED__NO_DELIVERY_OR_ACCEPTANCE_CLAIM"
  };
}

async function inspectTransitionReceipt(root, relativePath, expectedReceipt) {
  const expected = normalizeLfUtf8(Buffer.from(`${JSON.stringify(expectedReceipt, null, 2)}\n`, "utf8"));
  const target = insideRoot(root, relativePath);
  try {
    await assertNoLinks(root, relativePath, { missingCode: "BOOK_LOOP_TRANSITION_RECEIPT_MISSING" });
    const existing = await fs.readFile(target);
    if (!normalizeLfUtf8(existing).equals(expected)) fail("BOOK_LOOP_TRANSITION_RECEIPT_CONFLICT");
    return "MATCH";
  } catch (error) {
    if (error instanceof BookLoopRouterError && error.code === "BOOK_LOOP_TRANSITION_RECEIPT_MISSING") return "MISSING";
    if (error instanceof BookLoopRouterError) throw error;
    if (error?.code === "ENOENT") return "MISSING";
    fail("BOOK_LOOP_TRANSITION_RECEIPT_READ_FAILED", 4);
  }
}

async function validate(root, manifestPath) {
  const manifestBuffer = await readBounded(root, manifestPath, "BOOK_LOOP_MANIFEST_NOT_FOUND");
  const manifest = validateManifest(parseJson(manifestBuffer, "BOOK_LOOP_MANIFEST_JSON_INVALID"));
  const manifestHash = sha256LfUtf8(manifestBuffer);

  const pointerBuffer = await readBounded(root, manifest.pointer.path, "BOOK_LOOP_POINTER_NOT_FOUND");
  await assertNoLinks(root, manifest.pointer.path, { pointer: true });
  const pointerHash = sha256LfUtf8(pointerBuffer);
  const destinationPointerText = renderPointer(manifest);
  const destinationPointerHash = sha256LfUtf8(destinationPointerText);
  const alreadyAdvanced = pointerHash === destinationPointerHash;
  if (!alreadyAdvanced && pointerHash !== manifest.pointer.expected_sha256) fail("BOOK_LOOP_POINTER_MOVED", 3);
  const pointer = parsePointer(pointerBuffer);
  if (alreadyAdvanced && pointer.packetId !== manifest.destination.packet_id) fail("BOOK_LOOP_POINTER_DESTINATION_CONFLICT", 3);

  const sourcePacketBuffer = await readBounded(root, manifest.source.packet_path, "BOOK_LOOP_SOURCE_PACKET_NOT_FOUND");
  if (sha256LfUtf8(sourcePacketBuffer) !== manifest.source.packet_sha256) fail("BOOK_LOOP_SOURCE_PACKET_HASH_MISMATCH");
  const sourcePacket = parsePacket(sourcePacketBuffer);
  if (sourcePacket.packetId !== manifest.source.packet_id || sourcePacket.target !== manifest.source.target) fail("BOOK_LOOP_SOURCE_PACKET_CONFLICT");

  if (!alreadyAdvanced) {
    if (pointer.packetId !== manifest.source.packet_id || pointer.packetPath !== manifest.source.packet_path || pointer.packetHash !== manifest.source.packet_sha256 || pointer.target !== manifest.source.target || pointer.hashAlgorithm !== HASH_ALGORITHM) {
      fail("BOOK_LOOP_POINTER_SOURCE_CONFLICT", 3);
    }
  }

  const returnBuffer = await readBounded(root, manifest.source.return_path, "BOOK_LOOP_RETURN_NOT_FOUND");
  if (sha256LfUtf8(returnBuffer) !== manifest.source.return_sha256) fail("BOOK_LOOP_RETURN_HASH_MISMATCH");
  if (lastNonemptyLine(returnBuffer) !== manifest.source.terminal_marker) fail("BOOK_LOOP_RETURN_NOT_TERMINAL");
  const returnText = normalizeLfUtf8(returnBuffer).toString("utf8");
  if (plainField(returnText, "PACKET_ID", "BOOK_LOOP_RETURN_PACKET_MISMATCH") !== manifest.source.packet_id) fail("BOOK_LOOP_RETURN_PACKET_MISMATCH");

  const destinationPacketBuffer = await readBounded(root, manifest.destination.packet_path, "PACKET_QUEUE_EMPTY");
  if (sha256LfUtf8(destinationPacketBuffer) !== manifest.destination.packet_sha256) fail("BOOK_LOOP_DESTINATION_PACKET_HASH_MISMATCH");
  const destinationPacket = parsePacket(destinationPacketBuffer);
  if (destinationPacket.packetId !== manifest.destination.packet_id || destinationPacket.target !== manifest.destination.target || destinationPacket.status !== manifest.destination.status || destinationPacket.authority !== manifest.destination.authority) {
    fail("BOOK_LOOP_DESTINATION_PACKET_CONFLICT");
  }

  const expectedReceipt = transitionReceipt(manifest, manifestHash, manifest.pointer.expected_sha256, destinationPointerHash);
  const receiptSlot = await inspectTransitionReceipt(root, manifest.pointer.transition_receipt_path, expectedReceipt);

  return {
    manifest,
    manifestHash,
    pointerHash,
    destinationPointerText,
    destinationPointerHash,
    alreadyAdvanced,
    expectedReceipt,
    receiptSlot
  };
}

async function syncDirectory(directory) {
  let handle;
  try {
    handle = await fs.open(directory, fsConstants.O_RDONLY);
    await handle.sync();
  } catch (error) {
    if (!new Set(["EISDIR", "EINVAL", "ENOTSUP", "EPERM", "EACCES"]).has(error?.code)) throw error;
  } finally {
    await handle?.close().catch(() => {});
  }
}

async function atomicReplace(root, relativePath, content, expectedHash) {
  await assertNoLinks(root, relativePath, { pointer: true });
  const target = insideRoot(root, relativePath);
  const directory = path.dirname(target);
  const temporary = path.join(directory, `.${path.basename(target)}.${process.pid}.${randomUUID()}.tmp`);
  let handle;
  try {
    handle = await fs.open(temporary, "wx", 0o600);
    await handle.writeFile(content, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
    const current = await fs.readFile(target);
    if (sha256LfUtf8(current) !== expectedHash) fail("BOOK_LOOP_POINTER_MOVED", 3);
    await fs.rename(temporary, target);
    await syncDirectory(directory);
  } catch (error) {
    if (error instanceof BookLoopRouterError) throw error;
    fail("BOOK_LOOP_ATOMIC_WRITE_FAILED", 4);
  } finally {
    await handle?.close().catch(() => {});
    await fs.rm(temporary, { force: true }).catch(() => {});
  }
}

async function writeReceipt(root, relativePath, value) {
  const target = insideRoot(root, relativePath);
  const directory = path.dirname(target);
  await ensureDirectoriesNoLinks(root, path.posix.dirname(relativePath));
  await assertNoLinks(root, path.posix.dirname(relativePath));
  const text = `${JSON.stringify(value, null, 2)}\n`;
  try {
    const existing = await fs.readFile(target);
    if (normalizeLfUtf8(existing).equals(normalizeLfUtf8(Buffer.from(text, "utf8")))) return false;
    fail("BOOK_LOOP_TRANSITION_RECEIPT_CONFLICT");
  } catch (error) {
    if (error instanceof BookLoopRouterError) throw error;
    if (error?.code !== "ENOENT") fail("BOOK_LOOP_TRANSITION_RECEIPT_READ_FAILED", 4);
  }
  await assertNoLinks(root, relativePath, { allowMissingLeaf: true });
  const temporary = path.join(directory, `.${path.basename(target)}.${process.pid}.${randomUUID()}.tmp`);
  let handle;
  try {
    handle = await fs.open(temporary, "wx", 0o600);
    await handle.writeFile(text, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
    await fs.rename(temporary, target);
    await syncDirectory(directory);
    return true;
  } catch {
    fail("BOOK_LOOP_TRANSITION_RECEIPT_WRITE_FAILED", 4);
  } finally {
    await handle?.close().catch(() => {});
    await fs.rm(temporary, { force: true }).catch(() => {});
  }
}

function resultEnvelope(validation, mode, status, code, writesPerformed) {
  return {
    schema: RESULT_SCHEMA,
    ok: true,
    mode,
    status,
    code,
    manifest_id: validation.manifest.manifest_id,
    source_packet_id: validation.manifest.source.packet_id,
    destination_packet_id: validation.manifest.destination.packet_id,
    current_packet_path: validation.manifest.pointer.path,
    transition_receipt_path: validation.manifest.pointer.transition_receipt_path,
    writes_performed: writesPerformed,
    external_actions: "NOT_IMPLEMENTED"
  };
}

export async function runBookLoopRouter({ mailboxRoot, releaseManifestPath, apply = false }) {
  if (typeof mailboxRoot !== "string" || !path.isAbsolute(mailboxRoot)) fail("BOOK_LOOP_MAILBOX_ROOT_ABSOLUTE_REQUIRED");
  safeRelativePath(releaseManifestPath, "BOOK_LOOP_MANIFEST_PATH_INVALID");
  const rootStat = await fs.stat(mailboxRoot).catch(() => null);
  if (!rootStat?.isDirectory()) fail("BOOK_LOOP_MAILBOX_ROOT_INVALID");
  const root = await fs.realpath(mailboxRoot);

  const first = await validate(root, releaseManifestPath);
  if (!apply) {
    if (first.alreadyAdvanced && first.receiptSlot === "MISSING") {
      return resultEnvelope(first, "DRY_RUN", "RECOVERY_REQUIRED", "BOOK_LOOP_TRANSITION_RECEIPT_REQUIRED", 0);
    }
    return resultEnvelope(first, "DRY_RUN", first.alreadyAdvanced ? "NOOP" : "READY", first.alreadyAdvanced ? "BOOK_LOOP_ALREADY_ADVANCED" : "BOOK_LOOP_READY_TO_ADVANCE", 0);
  }

  const lock = insideRoot(root, LOCK_PATH);
  await ensureDirectoriesNoLinks(root, path.posix.dirname(LOCK_PATH));
  try {
    await fs.mkdir(lock);
  } catch (error) {
    fail(error?.code === "EEXIST" ? "BOOK_LOOP_ROUTER_LOCKED" : "BOOK_LOOP_LOCK_FAILED", error?.code === "EEXIST" ? 3 : 4);
  }

  try {
    const checked = await validate(root, releaseManifestPath);
    const receipt = checked.expectedReceipt;
    if (checked.alreadyAdvanced) {
      const wroteReceipt = await writeReceipt(root, checked.manifest.pointer.transition_receipt_path, receipt);
      return resultEnvelope(checked, "APPLY", wroteReceipt ? "RECOVERED" : "NOOP", wroteReceipt ? "BOOK_LOOP_TRANSITION_RECEIPT_RECOVERED" : "BOOK_LOOP_ALREADY_ADVANCED", wroteReceipt ? 1 : 0);
    }
    await atomicReplace(root, checked.manifest.pointer.path, checked.destinationPointerText, checked.manifest.pointer.expected_sha256);
    let wroteReceipt;
    try {
      wroteReceipt = await writeReceipt(root, checked.manifest.pointer.transition_receipt_path, receipt);
    } catch {
      const partial = new BookLoopRouterError("BOOK_LOOP_POINTER_ADVANCED_RECEIPT_PENDING", 4);
      partial.writesPerformed = 1;
      throw partial;
    }
    return resultEnvelope(checked, "APPLY", "APPLIED", "BOOK_LOOP_POINTER_ADVANCED", wroteReceipt ? 2 : 1);
  } finally {
    await fs.rmdir(lock).catch(() => {});
  }
}

export function errorEnvelope(error, apply = false) {
  const routerError = error instanceof BookLoopRouterError
    ? error
    : typeof error?.code === "string" && Number.isInteger(error?.exitCode)
      ? new BookLoopRouterError(error.code, error.exitCode)
      : new BookLoopRouterError("BOOK_LOOP_INTERNAL_ERROR", 4);
  return {
    output: {
      schema: RESULT_SCHEMA,
      ok: false,
      mode: apply ? "APPLY" : "DRY_RUN",
      status: "BLOCKED",
      code: routerError.code,
      writes_performed: Number.isInteger(routerError.writesPerformed) ? routerError.writesPerformed : 0,
      external_actions: "NOT_IMPLEMENTED"
    },
    exitCode: routerError.exitCode
  };
}
