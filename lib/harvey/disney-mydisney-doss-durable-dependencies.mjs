import { randomBytes as nodeRandomBytes, createHash } from "node:crypto";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

import { canonicalJson } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OWNER_SCHEMA = "pookakind.disney-mydisney-doss-durable-root/v1";

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function child(root, name) { const path = resolve(root, name); const rel = relative(root, path); if (!rel || rel.startsWith("..") || isAbsolute(rel)) fail("DISNEY_DOSS_DURABLE_PATH_ESCAPE"); return path; }
function exclusive(path, value) { const fd = openSync(path, "wx", 0o600); try { writeFileSync(fd, value); fsyncSync(fd); } finally { closeSync(fd); } }
function readJson(path, code) { try { return JSON.parse(readFileSync(path, "utf8")); } catch { fail(code); } }
function plain(value, code) { if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.getOwnPropertySymbols(value).length) fail(code); }

export function createDossDurableAppendOnceStore({ root, owner_id, namespace }) {
  if (typeof root !== "string" || !root || typeof owner_id !== "string" || !/^[A-Z0-9_.@-]{1,96}$/i.test(owner_id)
    || typeof namespace !== "string" || !/^[a-z][a-z0-9-]{0,47}$/.test(namespace)) fail("DISNEY_DOSS_DURABLE_ROOT_INVALID");
  const requested = resolve(root); mkdirSync(requested, { recursive: true, mode: 0o700 }); const ownedRoot = realpathSync(requested);
  const markerPath = child(ownedRoot, ".owner.json"); const marker = { schema: OWNER_SCHEMA, owner_id };
  if (!existsSync(markerPath)) { try { exclusive(markerPath, `${JSON.stringify(marker)}\n`); } catch (error) { if (error?.code !== "EEXIST") throw error; } }
  if (canonicalJson(readJson(markerPath, "DISNEY_DOSS_DURABLE_ROOT_INVALID")) !== canonicalJson(marker)) fail("DISNEY_DOSS_DURABLE_ROOT_OWNERSHIP_CONFLICT");
  const space = child(ownedRoot, namespace); mkdirSync(space, { recursive: true, mode: 0o700 }); const exactRoot = realpathSync(space);
  const paths = (id) => { if (!HASH.test(id ?? "")) fail("DISNEY_DOSS_DURABLE_OPERATION_INVALID"); return { claim: child(exactRoot, `${id}.claim`), terminal: child(exactRoot, `${id}.terminal.json`) }; };
  return Object.freeze({
    kind: "DURABLE_APPEND_ONCE_V1",
    async claim_once(id) { const p = paths(id); if (existsSync(p.claim) || existsSync(p.terminal)) return false; try { exclusive(p.claim, "CLAIMED\n"); return true; } catch (error) { if (error?.code === "EEXIST") return false; throw error; } },
    async read_terminal(id) { const p = paths(id); return existsSync(p.terminal) ? readJson(p.terminal, "DISNEY_DOSS_DURABLE_TERMINAL_INVALID") : null; },
    async append_terminal_once(id, receipt) {
      plain(receipt, "DISNEY_DOSS_DURABLE_TERMINAL_INVALID"); const p = paths(id); if (!existsSync(p.claim)) fail("DISNEY_DOSS_DURABLE_CLAIM_REQUIRED"); const bytes = `${canonicalJson(receipt)}\n`;
      try { exclusive(p.terminal, bytes); return { state: "APPENDED", receipt_sha256: digest(receipt) }; }
      catch (error) { if (error?.code !== "EEXIST") throw error; const prior = readJson(p.terminal, "DISNEY_DOSS_DURABLE_TERMINAL_INVALID"); if (canonicalJson(prior) !== canonicalJson(receipt)) fail("DISNEY_DOSS_DURABLE_TERMINAL_CONFLICT"); return { state: "EXACT_REPLAY", receipt_sha256: digest(prior) }; }
    },
  });
}

export function createDisneyMyDisneyDossDurableDependencyFactory({ root, owner_id, resolveOtpHandle, resolveCredentialHandle, vaultAdapter, now = () => Date.now(), randomBytes = (length) => nodeRandomBytes(length) }) {
  if (typeof resolveOtpHandle !== "function" || typeof resolveCredentialHandle !== "function" || typeof now !== "function" || typeof randomBytes !== "function"
    || typeof vaultAdapter?.saveCredentialOnce !== "function" || typeof vaultAdapter?.readbackCredential !== "function") fail("DISNEY_DOSS_DURABLE_DEPENDENCY_INVALID");
  const transactionStore = createDossDurableAppendOnceStore({ root, owner_id, namespace: "transactions" });
  const stepStore = createDossDurableAppendOnceStore({ root, owner_id, namespace: "provider-steps" });
  const otpStore = createDossDurableAppendOnceStore({ root, owner_id, namespace: "otp-steps" });
  const vaultStore = createDossDurableAppendOnceStore({ root, owner_id, namespace: "vault-saves" });
  return async (request) => {
    plain(request, "DISNEY_DOSS_DURABLE_RUNTIME_REQUEST_INVALID");
    if (request.schema !== "pookakind.disney-mydisney-full-conversion-doss-runtime-request/v1" || !HASH.test(request.session_ref_sha256 ?? "")
      || !HASH.test(request.profile_ref_sha256 ?? "") || !HASH.test(request.transaction_sha256 ?? "") || typeof request.extension_id !== "string") fail("DISNEY_DOSS_DURABLE_RUNTIME_REQUEST_INVALID");
    return Object.freeze({
      consumeTransaction: (id) => transactionStore.claim_once(id),
      consumeStep: (id) => stepStore.claim_once(id),
      consumeOtp: (id) => otpStore.claim_once(id),
      resolveOtpHandle,
      resolveHandle: resolveCredentialHandle,
      resolveVaultHandle: resolveCredentialHandle,
      vaultStore,
      vaultAdapter,
      now,
      randomBytes,
    });
  };
}
