import { createHash, timingSafeEqual } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const HASH = /^[a-f0-9]{64}$/;
const PROVIDERS = new Set([
  "Atlassian", "DocuSign", "Procore", "Shutterstock", "Jobber", "Nextdoor",
  "Vitality Medical", "A Better Gutter Cleaning", "Rosetta Stone", "SmartVault", "Ace Hardware",
]);

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function refDigest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function equalSecret(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  try {
    return a.length === b.length && timingSafeEqual(a, b);
  } finally {
    a.fill(0);
    b.fill(0);
  }
}

function normalizeForPreservation(item, targetId, replacement) {
  const copy = clone(item);
  copy.version = 0;
  copy.updatedAt = null;
  const targets = copy.fields?.filter((field) => field.id === targetId) ?? [];
  if (targets.length !== 1) fail("ATREYU_VAULT_TARGET_FIELD_AMBIGUOUS");
  targets[0].value = replacement;
  return copy;
}

export async function reconcileAtreyuVaultCredential({
  client,
  provider,
  vaultId,
  itemId,
  expectedVaultRefSha256,
  expectedItemRefSha256,
  material,
}) {
  if (!PROVIDERS.has(provider)) fail("ATREYU_VAULT_PROVIDER_NOT_ALLOWED");
  if (typeof client?.items?.get !== "function" || typeof client?.items?.put !== "function") fail("ATREYU_VAULT_CLIENT_INVALID");
  if (![vaultId, itemId, material].every((value) => typeof value === "string" && value.length > 0)) fail("ATREYU_VAULT_BINDING_MISSING");
  if (!HASH.test(expectedVaultRefSha256 ?? "") || !HASH.test(expectedItemRefSha256 ?? "")) fail("ATREYU_VAULT_REF_INVALID");
  if (refDigest(vaultId) !== expectedVaultRefSha256 || refDigest(itemId) !== expectedItemRefSha256) fail("ATREYU_VAULT_REF_CONFLICT");

  let original;
  let outbound;
  try {
    original = clone(await client.items.get(vaultId, itemId));
    if (!original || original.id !== itemId || original.vaultId !== vaultId || original.category !== "Login" || !Number.isSafeInteger(original.version) || !Array.isArray(original.fields)) fail("ATREYU_VAULT_ITEM_CUSTODY_CONFLICT");
    if (String(original.title ?? "").trim().toLowerCase() !== provider.toLowerCase()) fail("ATREYU_VAULT_PROVIDER_BINDING_CONFLICT");
    const targets = original.fields.filter((field) => field.fieldType === "Concealed" && /^(password|passwd)$/i.test(String(field.id ?? field.title ?? "")));
    if (targets.length !== 1) fail("ATREYU_VAULT_TARGET_FIELD_AMBIGUOUS");
    const targetId = targets[0].id;
    const originalVersion = original.version;

    outbound = clone(original);
    outbound.fields.find((field) => field.id === targetId).value = material;
    if (!isDeepStrictEqual(normalizeForPreservation(original, targetId, material), normalizeForPreservation(outbound, targetId, material))) fail("ATREYU_VAULT_NON_TARGET_DRIFT");

    const updated = clone(await client.items.put(outbound));
    const updatedTargets = updated?.fields?.filter((field) => field.id === targetId && field.fieldType === "Concealed") ?? [];
    if (!updated || updated.id !== itemId || updated.vaultId !== vaultId || updated.version <= originalVersion || updatedTargets.length !== 1 || !equalSecret(updatedTargets[0].value, material)) fail("ATREYU_VAULT_SAVE_NOT_ACCEPTED");
    if (!isDeepStrictEqual(normalizeForPreservation(original, targetId, material), normalizeForPreservation(updated, targetId, material))) fail("ATREYU_VAULT_SAVE_DRIFT");

    const readback = clone(await client.items.get(vaultId, itemId));
    const readbackTargets = readback?.fields?.filter((field) => field.id === targetId && field.fieldType === "Concealed") ?? [];
    if (readback?.version !== updated.version || readbackTargets.length !== 1 || !equalSecret(readbackTargets[0].value, material)) fail("ATREYU_VAULT_READBACK_MISMATCH");
    if (!isDeepStrictEqual(normalizeForPreservation(original, targetId, material), normalizeForPreservation(readback, targetId, material))) fail("ATREYU_VAULT_READBACK_DRIFT");

    return Object.freeze({
      schema: "pookakind.atreyu-vault-reconciliation/v1",
      state: "EXACT_ONE_NON_DUPLICATE_VERIFIED_CURRENT",
      provider,
      exact_match_count: 1,
      duplicate_count: 0,
      credential_status: "VERIFIED_CURRENT",
      prior_version: originalVersion,
      current_version: readback.version,
      item_ref_sha256: expectedItemRefSha256,
      vault_ref_sha256: expectedVaultRefSha256,
      readback_sha256: digest([provider, expectedVaultRefSha256, expectedItemRefSha256, readback.version]),
      non_target_fields_preserved: true,
      service_account_used: true,
      secret_material_output: false,
    });
  } finally {
    original = null;
    outbound = null;
    material = null;
  }
}
