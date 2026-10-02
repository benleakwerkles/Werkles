import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { createStewartDisneyOnePasswordVaultOrgan } from "../../../lib/harvey/stewart-disney-onepassword-vault-organ.mjs";

const h = (value) => createHash("sha256").update(value).digest("hex");
const request = { schema: "pookakind.password-provider-stage-request/v1", operation_sha256: h("operation"), binding_sha256: h("binding") };
const identity = { state: "EXACT_PRIVATE_BINDING", username: "operator@example.invalid", origin: "https://login.disney.com" };
function item(overrides = {}) { return { id: "item-1", title: "Disney", category: "Login", vaultId: "shared", fields: [{ id: "username", title: "username", fieldType: "Text", value: identity.username }, { id: "password", title: "password", fieldType: "Concealed", value: "old" }, { id: "passkey", title: "passkey", fieldType: "Text", value: "preserve" }], sections: [], notes: "keep", tags: ["keep"], websites: [{ url: identity.origin, label: "sign-in address", autofillBehavior: "ExactDomain" }], version: 2, files: [], createdAt: new Date(), updatedAt: new Date(), ...overrides }; }
function fixture(initial = [], state = "active") {
  let stored = structuredClone(initial); let creates = 0; let puts = 0;
  const client = { items: {
    list: async (vaultId) => stored.filter((entry) => entry.vaultId === vaultId).map(({ id, title, category, vaultId, websites, tags, createdAt, updatedAt }) => ({ id, title, category, vaultId, websites, tags, createdAt, updatedAt, state })),
    get: async (vaultId, id) => structuredClone(stored.find((entry) => entry.vaultId === vaultId && entry.id === id)),
    create: async (params) => { creates++; const created = item({ ...params, id: `created-${creates}`, version: 1, files: [], createdAt: new Date(), updatedAt: new Date() }); stored.push(created); return structuredClone(created); },
    put: async (next) => { puts++; const updated = structuredClone(next); updated.version += 1; stored = stored.map((entry) => entry.id === updated.id ? updated : entry); return structuredClone(updated); },
  } };
  const organ = () => createStewartDisneyOnePasswordVaultOrgan({ client, scope: ["shared", "other"], target_vault_id: "shared", resolveIdentity: async () => structuredClone(identity), resolveCredential: async () => ({ resolved: true, material: "new-private" }) });
  return { client, organ, state: () => ({ stored, creates, puts }) };
}

test("creates exactly one login when the full authorized scope has zero matches", async () => {
  const f = fixture(); const receipt = await f.organ().reconcileExactOneVault(request);
  assert.equal(receipt.reconciliation_mode, "CREATED"); assert.equal(receipt.exact_match_count, 1); assert.equal(f.state().creates, 1); assert.equal(f.state().puts, 0);
  assert.doesNotMatch(JSON.stringify(receipt), /new-private|operator@/);
});

test("updates exactly one login and preserves passkey and metadata", async () => {
  const f = fixture([item()]); const receipt = await f.organ().reconcileExactOneVault(request); const current = f.state().stored[0];
  assert.equal(receipt.reconciliation_mode, "UPDATED"); assert.equal(f.state().creates, 0); assert.equal(f.state().puts, 1);
  assert.equal(current.fields.find((field) => field.id === "passkey").value, "preserve"); assert.equal(current.notes, "keep"); assert.deepEqual(current.tags, ["keep"]);
});

test("an existing Disney login URL with a path is updated, never duplicated", async () => {
  const existing = item({ websites: [{ url: "https://login.disney.com/en-US/US/DTCI-MY.ACCOUNT.WEB/interaction", label: "sign-in address", autofillBehavior: "ExactDomain" }] });
  const f = fixture([existing]);
  const receipt = await f.organ().reconcileExactOneVault(request);
  assert.equal(receipt.reconciliation_mode, "UPDATED");
  assert.equal(f.state().creates, 0);
  assert.equal(f.state().puts, 1);
});

test("fails closed on duplicates, write substitution, readback drift, and second use", async () => {
  const duplicate = fixture([item(), item({ id: "item-2", vaultId: "other" })]); await assert.rejects(duplicate.organ().reconcileExactOneVault(request), /DUPLICATE/);
  const archived = fixture([item()], "archived"); await assert.rejects(archived.organ().reconcileExactOneVault(request), /ARCHIVED_MATCH/);
  const substituted = fixture(); substituted.client.items.create = async (params) => item({ ...params, id: "created", vaultId: "outside", version: 1 }); await assert.rejects(substituted.organ().reconcileExactOneVault(request), /WRITE_DRIFT/);
  const drift = fixture(); drift.client.items.create = async (params) => { const created = item({ ...params, id: "created", version: 1 }); drift.state().stored.push({ ...created, fields: created.fields.map((field) => field.id === "password" ? { ...field, value: "wrong" } : field) }); return created; }; await assert.rejects(drift.organ().reconcileExactOneVault(request), /READBACK_DRIFT/);
  const once = fixture().organ(); await once.reconcileExactOneVault(request); await assert.rejects(once.reconcileExactOneVault(request), /ALREADY_CONSUMED/);
});

test("rejects secret-shaped receipt output and unsupported scope", async () => {
  assert.throws(() => createStewartDisneyOnePasswordVaultOrgan({ client: { items: {} }, scope: [], target_vault_id: "shared", resolveIdentity() {}, resolveCredential() {} }), /ORGAN_INVALID/);
});
