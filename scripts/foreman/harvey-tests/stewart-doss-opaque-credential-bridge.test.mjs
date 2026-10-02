import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createDossImportedCredentialBridge } from "../../../lib/harvey/stewart-doss-opaque-credential-bridge.mjs";
import { canonicalJson } from "../../../lib/harvey/station-crypto-core.mjs";

const h = (value) => createHash("sha256").update(value).digest("hex");

test("one imported opaque credential binds provider, origin, account, action and role without receipt exposure", async () => {
  const parent = mkdtempSync(join(tmpdir(), "stewart-provider-bridge-"));
  try {
    const root = join(parent, "secrets"); mkdirSync(root);
    writeFileSync(join(root, "blind-master.dpapi"), "synthetic-sealed-bytes");
    const resolver = join(parent, "resolver.exe"); writeFileSync(resolver, "synthetic-resolver");
    let captured; let resolveCalls = 0;
    const base = { resolver_executable: resolver, allowed_root: root, provider_id: "DREAMHOST",
      canonical_origin_sha256: h("provider-origin"), operation_sha256: h("one-operation"), account_ref_sha256: h("one-account"),
      action: "PASSWORD_RESET", role: "NEW_PASSWORD", handle_name: "blind-master" };
    const bridge = createDossImportedCredentialBridge({ ...base, run: (_exe, args, options) => {
      resolveCalls++;
      assert.deepEqual(args, ["--handle", "blind-master", "--path", join(root, "blind-master.dpapi")]);
      assert.equal(options.windowsHide, true);
      const bytes = Buffer.from("synthetic-secret-not-for-receipt"); captured = Buffer.alloc(bytes.length + 4);
      captured.writeUInt32LE(bytes.length); bytes.copy(captured, 4);
      return { status: 0, stdout: captured };
    } });
    const command = { schema: "pookakind.stewart-background-credential-command/v1", operation_kind: "PASSWORD_RESET",
      account_ref_sha256: base.account_ref_sha256, canonical_origin_sha256: base.canonical_origin_sha256,
      operation_id_sha256: h(canonicalJson([base.operation_sha256, "passwordChange"])), max_uses: 1,
      fields: ["NEW_PASSWORD", "CONFIRM_PASSWORD"].map((role) => ({ role, handle_ref_sha256: bridge.handle.ref_sha256 })) };
    for (const drift of [{ provider_id: "DISNEY_MYDISNEY" }, { canonical_origin_sha256: h("other-origin") },
      { account_ref_sha256: h("other-account") }, { operation_sha256: h("other-operation") },
      { action: "SIGN_IN", role: "CURRENT_PASSWORD" }, { role: "CONFIRM_PASSWORD" }]) {
      const other = createDossImportedCredentialBridge({ ...base, ...drift });
      assert.notEqual(other.handle.ref_sha256, bridge.handle.ref_sha256);
      await assert.rejects(bridge.resolve_for_stage({ provider_id: base.provider_id, stage: "passwordChange", command, handle: other.handle }), /STAGE_HANDLE_INVALID/);
    }
    assert.equal(bridge.receipt.state, "EXACT_LOCAL_HANDLE_BOUND_NOT_USED");
    assert.equal(bridge.receipt.provider_contacted, false);
    assert.doesNotMatch(JSON.stringify(bridge.receipt), /synthetic-secret|synthetic-sealed|\.dpapi|resolver\.exe/);
    for (const drift of [{ provider_id: "DISNEY_MYDISNEY" }, { stage: "freshSignIn" },
      { command: { ...command, account_ref_sha256: h("other-account") } },
      { command: { ...command, canonical_origin_sha256: h("other-origin") } },
      { command: { ...command, operation_id_sha256: h("other-operation") } },
      { command: { ...command, max_uses: 2 } },
      { command: { ...command, fields: [...command.fields, { role: "IDENTITY", handle_ref_sha256: bridge.handle.ref_sha256 }] } },
      { command: { ...command, fields: [{ role: "IDENTITY", handle_ref_sha256: bridge.handle.ref_sha256 }] } }]) {
      await assert.rejects(bridge.resolve_for_stage({ provider_id: base.provider_id, stage: "passwordChange", command, handle: bridge.handle, ...drift }), /STAGE_SCOPE_INVALID/);
    }
    assert.equal(resolveCalls, 0);
    assert.deepEqual(await bridge.resolve_for_stage({ provider_id: base.provider_id, stage: "passwordChange", command, handle: bridge.handle }), { resolved: true, material: "synthetic-secret-not-for-receipt" });
    const signIn = { ...command, operation_kind: "SIGN_IN", operation_id_sha256: h(canonicalJson([base.operation_sha256, "freshSignIn"])),
      fields: [{ role: "IDENTITY", handle_ref_sha256: h("identity-handle") }, { role: "CURRENT_PASSWORD", handle_ref_sha256: bridge.handle.ref_sha256 }] };
    assert.deepEqual(await bridge.resolve_for_stage({ provider_id: base.provider_id, stage: "freshSignIn", command: signIn, handle: bridge.handle }), { resolved: true, material: "synthetic-secret-not-for-receipt" });
    assert.equal(resolveCalls, 2);
    assert.ok(captured.every((byte) => byte === 0));
  } finally { rmSync(parent, { recursive: true, force: true }); }
});

test("generic bridge rejects arbitrary actions, incompatible roles, path escape and missing sealed handle", () => {
  const parent = mkdtempSync(join(tmpdir(), "stewart-provider-hostile-"));
  try {
    const root = join(parent, "secrets"); mkdirSync(root);
    const resolver = join(parent, "resolver.exe"); writeFileSync(resolver, "synthetic-resolver");
    const base = { resolver_executable: resolver, allowed_root: root, provider_id: "DREAMHOST",
      canonical_origin_sha256: h("origin"), operation_sha256: h("op"), account_ref_sha256: h("account"),
      action: "PASSWORD_RESET", role: "NEW_PASSWORD", handle_name: "blind-master" };
    assert.throws(() => createDossImportedCredentialBridge(base), /ENOENT/);
    writeFileSync(join(root, "blind-master.dpapi"), "synthetic");
    assert.throws(() => createDossImportedCredentialBridge({ ...base, action: "CONTACT_UPDATE" }), /INPUT_INVALID/);
    assert.throws(() => createDossImportedCredentialBridge({ ...base, action: "PASSKEY_ENROLLMENT" }), /INPUT_INVALID/);
    assert.throws(() => createDossImportedCredentialBridge({ ...base, action: "PASSWORD_CHANGE" }), /INPUT_INVALID/);
    assert.throws(() => createDossImportedCredentialBridge({ ...base, role: "CURRENT_PASSWORD" }), /INPUT_INVALID/);
    assert.throws(() => createDossImportedCredentialBridge({ ...base, handle_name: "../escape" }), /INPUT_INVALID/);
    assert.throws(() => createDossImportedCredentialBridge({ ...base, provider_id: "https://example.invalid" }), /INPUT_INVALID/);
  } finally { rmSync(parent, { recursive: true, force: true }); }
});
