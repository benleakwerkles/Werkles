import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  compileStewartWindowsSecurityUiAccessSigningInstall,
  runStewartWindowsSecurityUiAccessSigningInstall,
  STEWART_WINDOWS_SECURITY_UIACCESS_SIGNING_RELEASE as release,
} from "../../../lib/harvey/stewart-windows-security-uiaccess-signing-install.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const now = Date.parse("2026-08-24T12:00:10Z");
const signer = generateIdentity();
const authority = { public_key_pem: signer.public_key_pem, public_key_sha256: signer.public_key_sha256 };
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const makeTransaction = (operation) => {
  const payload = {
    schema: "pookakind.stewart-windows-security-uiaccess-install-authority/v1",
    decision: "APPROVED",
    machine: "DOSS",
    operation_id_sha256: operation.repeat(64),
    package_sha256: release.package_sha256,
    production_executable_sha256: release.production_executable_sha256,
    certificate_profile: structuredClone(release.certificate_profile),
    install_root: release.install_root,
    approved_at: "2026-08-24T12:00:00Z",
    expires_at: "2026-08-24T12:10:00Z",
    max_uses: 1,
    recurrence: false,
    complete_rollback_required: true,
  };
  const activation_record = signDurableRecord(signer.private_key_pem, payload, {
    issuer: "pookakind-operator",
    audience: `stewart-windows-security-uiaccess-install:DOSS:${payload.operation_id_sha256}`,
  });
  return compileStewartWindowsSecurityUiAccessSigningInstall({ operator_authority: authority, activation_record, now });
};

test("one approval cannot be respent by minting a different signed operation id", async () => {
  const first = makeTransaction("a");
  const second = makeTransaction("b");
  let terminal = null;
  let claimed = false;
  const keys = [];
  let executions = 0;
  const store = {
    kind: "DURABLE_APPEND_ONCE_V1",
    read_terminal: async (key) => { keys.push(["read", key]); return terminal; },
    claim_once: async (key) => { keys.push(["claim", key]); if (claimed) return false; claimed = true; return true; },
    append_terminal_once: async (key, receipt) => { keys.push(["append", key]); terminal = receipt; return receipt; },
  };
  const adapter = {
    inspect: async () => ({ state: "CLEAN_ABSENT" }),
    sign_once: async (transaction) => ({ state: "SIGNED_EXACT_PE", certificate_thumbprint: "A".repeat(40), certificate_profile_sha256: digest(transaction.certificate_profile) }),
    install_once: async () => ({ state: "INSTALLED_ADMIN_ONLY" }),
    synthetic_proof_once: async () => { executions += 1; return { state: "UIACCESS_BACKGROUND_SYNTHETIC_PASS", foreground_changed: false, secret_accessed: false }; },
    rollback_once: async () => ({ state: "CLEAN_ABSENT_VERIFIED" }),
  };
  const receipt = await runStewartWindowsSecurityUiAccessSigningInstall({ transaction: first, store, adapter, now });
  const replay = await runStewartWindowsSecurityUiAccessSigningInstall({ transaction: second, store, adapter, now });
  assert.deepEqual(replay, receipt);
  assert.equal(executions, 1);
  assert.ok(keys.every(([, key]) => key === release.approval_scope_sha256));
});
