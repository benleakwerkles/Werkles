import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@1password/sdk";

const HASH = /^[a-f0-9]{64}$/;

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function equalSecret(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  try { return a.length === b.length && timingSafeEqual(a, b); }
  finally { a.fill(0); b.fill(0); }
}

function preservationDigest(item, targetFieldId) {
  const copy = JSON.parse(JSON.stringify(item));
  copy.version = 0;
  copy.updatedAt = null;
  const targets = copy.fields?.filter((field) => field.id === targetFieldId) ?? [];
  if (targets.length !== 1) fail("WISESTAMP_VAULT_TARGET_FIELD_AMBIGUOUS");
  targets[0].value = "<TARGET_CONCEALED_VALUE>";
  return digest(copy);
}

const token = process.env.OP_SERVICE_ACCOUNT_TOKEN;
const vaultId = process.env.PK_WISESTAMP_VAULT_ID;
const itemId = process.env.PK_WISESTAMP_ITEM_ID;
const expectedItemRefSha256 = process.env.PK_WISESTAMP_ITEM_REF_SHA256;
const authority = process.env.PK_PASSWORD_AUTOMATICA_AUTHORITY;
let material = process.env.PK_BLIND_MASTER_MATERIAL;
delete process.env.PK_BLIND_MASTER_MATERIAL;

try {
  if (typeof token !== "string" || token.length < 32) fail("WISESTAMP_VAULT_SERVICE_TOKEN_UNAVAILABLE");
  if (![vaultId, itemId].every((value) => typeof value === "string" && value.length > 0) || typeof material !== "string" || material.length < 1) fail("WISESTAMP_VAULT_BINDING_MISSING");
  if (!HASH.test(expectedItemRefSha256 ?? "") || createHash("sha256").update(itemId).digest("hex") !== expectedItemRefSha256) fail("WISESTAMP_VAULT_ITEM_BINDING_CONFLICT");
  if (authority !== "OPERATOR_DIRECT_PASSWORD_AUTOMATICA_FULL_CONVERSION") fail("WISESTAMP_VAULT_AUTHORITY_MISSING");

  const client = await createClient({ auth: token, integrationName: "PookaKind Password Automatica", integrationVersion: "1" });
  delete process.env.OP_SERVICE_ACCOUNT_TOKEN;

  const original = await client.items.get(vaultId, itemId);
  if (!original || original.id !== itemId || original.vaultId !== vaultId || original.category !== "Login" || !Number.isSafeInteger(original.version) || !Array.isArray(original.fields)) fail("WISESTAMP_VAULT_ITEM_CUSTODY_CONFLICT");
  const targetFields = original.fields.filter((field) => field.fieldType === "Concealed" && /^(password|passwd)$/i.test(String(field.id ?? field.title ?? "")));
  if (targetFields.length !== 1) fail("WISESTAMP_VAULT_TARGET_FIELD_AMBIGUOUS");
  const targetField = targetFields[0];
  const originalVersion = original.version;
  const beforePreservationSha256 = preservationDigest(original, targetField.id);

  try {
    targetField.value = material;
    const updated = await client.items.put(original);
    if (!updated || updated.id !== itemId || updated.vaultId !== vaultId || updated.version <= originalVersion) fail("WISESTAMP_VAULT_SAVE_NOT_ACCEPTED");
    if (preservationDigest(updated, targetField.id) !== beforePreservationSha256) fail("WISESTAMP_VAULT_NON_TARGET_DRIFT");

    const readback = await client.items.get(vaultId, itemId);
    const readbackFields = readback?.fields?.filter((field) => field.id === targetField.id && field.fieldType === "Concealed") ?? [];
    if (readback?.version !== updated.version || readbackFields.length !== 1 || !equalSecret(readbackFields[0].value, material)) fail("WISESTAMP_VAULT_READBACK_MISMATCH");
    if (preservationDigest(readback, targetField.id) !== beforePreservationSha256) fail("WISESTAMP_VAULT_READBACK_DRIFT");

    process.stdout.write(JSON.stringify({
      schema: "pookakind.wisestamp-vault-reconciliation/v1",
      state: "EXACT_ONE_NON_DUPLICATE_VERIFIED_CURRENT",
      provider: "WiseStamp",
      exact_match_count: 1,
      duplicate_count: 0,
      credential_status: "VERIFIED_CURRENT",
      prior_version: originalVersion,
      current_version: readback.version,
      item_ref_sha256: expectedItemRefSha256,
      readback_sha256: digest(["WiseStamp", expectedItemRefSha256, readback.version, beforePreservationSha256]),
      non_target_fields_preserved: true,
      service_account_used: true,
      secret_material_output: false,
    }));
  } finally {
    material = null;
  }
} catch (error) {
  process.stderr.write(String(error?.code ?? "WISESTAMP_VAULT_RECONCILIATION_FAILED"));
  process.exitCode = 1;
} finally {
  delete process.env.OP_SERVICE_ACCOUNT_TOKEN;
  delete process.env.PK_WISESTAMP_VAULT_ID;
  delete process.env.PK_WISESTAMP_ITEM_ID;
  delete process.env.PK_WISESTAMP_ITEM_REF_SHA256;
  delete process.env.PK_BLIND_MASTER_MATERIAL;
  delete process.env.PK_PASSWORD_AUTOMATICA_AUTHORITY;
}
