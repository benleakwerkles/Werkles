import { spawnSync } from "node:child_process";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

import { keyFingerprint, verifyDurableRecord } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OWNER_SCHEMA = "pookakind.stewart-private-inbox-email-otp-doss-root/v1";
const OWNER_FILE = ".stewart-private-inbox-email-otp-root.json";

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function safeRef(value) { if (!HASH.test(value ?? "")) fail("STEWART_PRIVATE_INBOX_OTP_DOSS_REF_INVALID"); return value; }
function exactChild(root, name) {
  const child = resolve(root, name);
  const rel = relative(root, child);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) fail("STEWART_PRIVATE_INBOX_OTP_DOSS_PATH_ESCAPE");
  return child;
}
function durableWriteExclusive(path, bytes) {
  const fd = openSync(path, "wx", 0o600);
  try { writeFileSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); }
}
function readJson(path, code) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { fail(code); }
}
function assertPlain(value, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.getOwnPropertySymbols(value).length) fail(code);
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
}

const DPAPI_SCRIPT = String.raw`
$ErrorActionPreference='Stop'
$inputObject = [Console]::In.ReadToEnd() | ConvertFrom-Json
$material = [Convert]::FromBase64String([string]$inputObject.material_base64)
$entropy = [Convert]::FromBase64String([string]$inputObject.entropy_base64)
try {
  if ([string]$inputObject.operation -eq 'PROTECT') {
    $result = [Security.Cryptography.ProtectedData]::Protect($material,$entropy,[Security.Cryptography.DataProtectionScope]::CurrentUser)
  } elseif ([string]$inputObject.operation -eq 'UNPROTECT') {
    $result = [Security.Cryptography.ProtectedData]::Unprotect($material,$entropy,[Security.Cryptography.DataProtectionScope]::CurrentUser)
  } else { throw 'DPAPI_OPERATION_INVALID' }
  [Console]::Out.Write([Convert]::ToBase64String($result))
} finally {
  if ($null -ne $result) { [Array]::Clear($result,0,$result.Length) }
  [Array]::Clear($material,0,$material.Length)
  [Array]::Clear($entropy,0,$entropy.Length)
}
`;

export function createWindowsCurrentUserDpapiCodec({ run = spawnSync } = {}) {
  if (typeof run !== "function") fail("STEWART_PRIVATE_INBOX_OTP_DPAPI_RUNNER_INVALID");
  function invoke(operation, material, entropy) {
    const materialBuffer = Buffer.from(material); const entropyBuffer = Buffer.from(entropy);
    try {
      const input = JSON.stringify({ operation, material_base64: materialBuffer.toString("base64"), entropy_base64: entropyBuffer.toString("base64") });
      const result = run("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", DPAPI_SCRIPT], { input, encoding: "utf8", windowsHide: true, maxBuffer: 1024 * 1024 });
      if (!result || result.status !== 0 || typeof result.stdout !== "string" || result.stdout.trim().length === 0) fail("STEWART_PRIVATE_INBOX_OTP_DPAPI_FAILED");
      return Buffer.from(result.stdout.trim(), "base64");
    } finally { materialBuffer.fill(0); entropyBuffer.fill(0); }
  }
  return Object.freeze({
    protect: async (material, entropy) => { const bytes = invoke("PROTECT", material, entropy); try { return bytes.toString("base64"); } finally { bytes.fill(0); } },
    unprotect: async (ciphertextBase64, entropy) => {
      if (typeof ciphertextBase64 !== "string" || ciphertextBase64.length === 0) fail("STEWART_PRIVATE_INBOX_OTP_CIPHERTEXT_INVALID");
      const ciphertext = Buffer.from(ciphertextBase64, "base64");
      try { return invoke("UNPROTECT", ciphertext, entropy); } finally { ciphertext.fill(0); }
    },
  });
}

export function createPinnedOtpRecordVerifier({ public_key_pem, public_key_sha256, issuer, audience }) {
  if (typeof public_key_pem !== "string" || !HASH.test(public_key_sha256 ?? "") || keyFingerprint(public_key_pem) !== public_key_sha256 || typeof issuer !== "string" || !issuer || typeof audience !== "string" || !audience) fail("STEWART_PRIVATE_INBOX_OTP_AUTHORITY_PIN_INVALID");
  const pinnedPem = `${public_key_pem}`; const pinnedIssuer = `${issuer}`; const pinnedAudience = `${audience}`;
  return async (record) => verifyDurableRecord(pinnedPem, record, { issuer: pinnedIssuer, audience: pinnedAudience });
}

export function createDossPrivateInboxEmailOtpStore({ root, owner_id }) {
  if (typeof root !== "string" || root.length === 0 || typeof owner_id !== "string" || !/^[A-Z0-9_.@-]{1,96}$/i.test(owner_id)) fail("STEWART_PRIVATE_INBOX_OTP_DOSS_ROOT_INVALID");
  const requested = resolve(root); mkdirSync(requested, { recursive: true, mode: 0o700 });
  const ownedRoot = realpathSync(requested); const markerPath = exactChild(ownedRoot, OWNER_FILE);
  const expectedMarker = { schema: OWNER_SCHEMA, owner_id };
  if (!existsSync(markerPath)) {
    try { durableWriteExclusive(markerPath, `${JSON.stringify(expectedMarker)}\n`); } catch (error) { if (error?.code !== "EEXIST") throw error; }
  }
  const marker = readJson(markerPath, "STEWART_PRIVATE_INBOX_OTP_DOSS_ROOT_INVALID");
  if (JSON.stringify(marker) !== JSON.stringify(expectedMarker) || realpathSync(dirname(markerPath)) !== ownedRoot) fail("STEWART_PRIVATE_INBOX_OTP_DOSS_ROOT_OWNERSHIP_CONFLICT");
  const paths = (ref) => { const safe = safeRef(ref); return { envelope: exactChild(ownedRoot, `${safe}.envelope.json`), claim: exactChild(ownedRoot, `${safe}.claim`), consumed: exactChild(ownedRoot, `${safe}.consumed`) }; };
  return Object.freeze({
    create: async (ref, envelope) => {
      assertPlain(envelope, "STEWART_PRIVATE_INBOX_OTP_ENVELOPE_INVALID"); const p = paths(ref);
      if (existsSync(p.envelope) || existsSync(p.claim) || existsSync(p.consumed)) return false;
      try { durableWriteExclusive(p.envelope, `${JSON.stringify(envelope)}\n`); return true; } catch (error) { if (error?.code === "EEXIST") return false; throw error; }
    },
    claim: async (ref) => {
      const p = paths(ref); if (existsSync(p.consumed)) return { state: "CONSUMED" }; if (!existsSync(p.envelope)) return { state: "ABSENT" };
      try { durableWriteExclusive(p.claim, "CLAIMED\n"); } catch (error) { if (error?.code === "EEXIST") return { state: "CONSUMING" }; throw error; }
      return { state: "CONSUMING", envelope: readJson(p.envelope, "STEWART_PRIVATE_INBOX_OTP_ENVELOPE_INVALID") };
    },
    consume: async (ref) => {
      const p = paths(ref); if (!existsSync(p.claim) || !existsSync(p.envelope) || existsSync(p.consumed)) return false;
      try { durableWriteExclusive(p.consumed, "CONSUMED\n"); } catch (error) { if (error?.code === "EEXIST") return false; throw error; }
      rmSync(p.envelope, { force: true }); rmSync(p.claim, { force: true }); return true;
    },
    inspect: async (ref) => {
      const p = paths(ref); if (existsSync(p.consumed)) return { state: "CONSUMED" }; if (existsSync(p.claim)) return { state: "CONSUMING" }; if (existsSync(p.envelope)) return { state: "PENDING" }; return { state: "ABSENT" };
    },
  });
}

export function createDossPrivateInboxEmailOtpAdapters({ root, owner_id, authority, run }) {
  assertPlain(authority, "STEWART_PRIVATE_INBOX_OTP_AUTHORITY_PIN_INVALID");
  const codec = createWindowsCurrentUserDpapiCodec({ run });
  return Object.freeze({ ...codec, store: createDossPrivateInboxEmailOtpStore({ root, owner_id }), verifyRecord: createPinnedOtpRecordVerifier(authority) });
}
