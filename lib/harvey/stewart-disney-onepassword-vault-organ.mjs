import { createHash, timingSafeEqual } from "node:crypto";

const HASH = /^[a-f0-9]{64}$/;
const PRIVATE_KEY = /^(?:credential|material|otp|passcode|password|pin|secret|token|value)$/i;

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function equal(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
function safeOrigin(value) { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.origin : null; } catch { return null; } }
function rejectPrivate(value) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return;
  if (!value || typeof value !== "object") fail("STEWART_DISNEY_VAULT_OUTPUT_INVALID");
  for (const [key, child] of Object.entries(value)) { if (PRIVATE_KEY.test(key)) fail("STEWART_DISNEY_VAULT_PRIVATE_OUTPUT_FORBIDDEN"); rejectPrivate(child); }
}
function clone(value) {
  if (value === null || ["string", "number", "boolean", "undefined"].includes(typeof value)) return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (!value || typeof value !== "object" || Object.getOwnPropertySymbols(value).length) fail("STEWART_DISNEY_VAULT_ITEM_SHAPE_INVALID");
  if (Array.isArray(value)) return value.map(clone);
  if (![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail("STEWART_DISNEY_VAULT_ITEM_SHAPE_INVALID");
  const out = {};
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail("STEWART_DISNEY_VAULT_ITEM_SHAPE_INVALID");
    out[key] = clone(descriptor.value);
  }
  return out;
}

export function createStewartDisneyOnePasswordVaultOrgan({ client, scope, target_vault_id, resolveIdentity, resolveCredential, title = "Disney" }) {
  if (!client?.items || typeof client.items.list !== "function" || typeof client.items.get !== "function"
    || typeof client.items.create !== "function" || typeof client.items.put !== "function"
    || !Array.isArray(scope) || scope.length < 1 || new Set(scope).size !== scope.length || !scope.includes(target_vault_id)
    || typeof resolveIdentity !== "function" || typeof resolveCredential !== "function"
    || typeof title !== "string" || !title.trim()) fail("STEWART_DISNEY_VAULT_ORGAN_INVALID");
  let consumed = false;

  async function inventory(identity) {
    const matches = [];
    for (const vaultId of scope) {
      const overviews = await client.items.list(vaultId, { type: "ByState", content: { active: true, archived: true } });
      if (!Array.isArray(overviews)) fail("STEWART_DISNEY_VAULT_INVENTORY_UNPROVEN");
      for (const overview of overviews) {
        if (overview?.vaultId !== vaultId) fail("STEWART_DISNEY_VAULT_INVENTORY_DRIFT");
        if (overview.category !== "Login" || !Array.isArray(overview.websites) || !overview.websites.some((site) => safeOrigin(site?.url) === identity.origin)) continue;
        const item = clone(await client.items.get(vaultId, overview.id));
        if (item?.id !== overview.id || item.vaultId !== vaultId || item.category !== "Login" || !Array.isArray(item.fields)) fail("STEWART_DISNEY_VAULT_INVENTORY_DRIFT");
        const usernames = item.fields.filter((field) => field.id === "username" && field.fieldType === "Text");
        if (usernames.length !== 1) fail("STEWART_DISNEY_VAULT_IDENTITY_AMBIGUOUS");
        if (equal(usernames[0].value, identity.username)) matches.push({ item, state: overview.state });
      }
    }
    return matches;
  }

  return Object.freeze({
    async reconcileExactOneVault(request) {
      if (consumed) fail("STEWART_DISNEY_VAULT_OPERATION_ALREADY_CONSUMED");
      consumed = true;
      if (request?.schema !== "pookakind.password-provider-stage-request/v1" || !HASH.test(request.operation_sha256 ?? "") || !HASH.test(request.binding_sha256 ?? "")) fail("STEWART_DISNEY_VAULT_REQUEST_INVALID");
      let identity; let material = null; let selected = null; let mode = null;
      try {
        identity = await resolveIdentity({ operation_sha256: request.operation_sha256, binding_sha256: request.binding_sha256 });
        if (identity?.state !== "EXACT_PRIVATE_BINDING" || typeof identity.username !== "string" || !identity.username || !safeOrigin(identity.origin)) fail("STEWART_DISNEY_VAULT_IDENTITY_INVALID");
        const before = await inventory(identity);
        if (before.length > 1) fail("STEWART_DISNEY_VAULT_DUPLICATE");
        if (before.length === 1 && before[0].state !== "active") fail("STEWART_DISNEY_VAULT_ARCHIVED_MATCH_REQUIRES_REVIEW");
        const resolved = await resolveCredential({ operation_sha256: request.operation_sha256, binding_sha256: request.binding_sha256 });
        if (resolved?.resolved !== true || typeof resolved.material !== "string" || !resolved.material) fail("STEWART_DISNEY_VAULT_CREDENTIAL_UNAVAILABLE");
        material = resolved.material;
        if (before.length === 0) {
          mode = "CREATED";
          selected = clone(await client.items.create({
            category: "Login", vaultId: target_vault_id, title: title.trim(),
            fields: [
              { id: "username", title: "username", fieldType: "Text", value: identity.username },
              { id: "password", title: "password", fieldType: "Concealed", value: material },
            ],
            sections: [], notes: "", tags: ["pookakind-verified-current"],
            websites: [{ url: identity.origin, label: "sign-in address", autofillBehavior: "ExactDomain" }],
          }));
        } else {
          mode = "UPDATED";
          const original = before[0].item;
          const passwords = original.fields.filter((field) => field.id === "password" && field.fieldType === "Concealed");
          if (passwords.length !== 1 || original.fields.filter((field) => field.id === "password").length !== 1) fail("STEWART_DISNEY_VAULT_PASSWORD_FIELD_AMBIGUOUS");
          const outbound = clone(original); outbound.fields.find((field) => field.id === "password").value = material;
          selected = clone(await client.items.put(outbound));
          if (selected?.id !== original.id || selected.vaultId !== original.vaultId || selected.version <= original.version) fail("STEWART_DISNEY_VAULT_UPDATE_DRIFT");
        }
        if (!selected?.id || !scope.includes(selected.vaultId)) fail("STEWART_DISNEY_VAULT_WRITE_DRIFT");
        const after = await inventory(identity);
        if (after.length !== 1 || after[0].state !== "active" || after[0].item.id !== selected.id || after[0].item.vaultId !== selected.vaultId) fail("STEWART_DISNEY_VAULT_EXACT_ONE_NOT_PROVED");
        const passwordFields = after[0].item.fields.filter((field) => field.id === "password" && field.fieldType === "Concealed");
        if (passwordFields.length !== 1 || !equal(passwordFields[0].value, material)) fail("STEWART_DISNEY_VAULT_READBACK_DRIFT");
        const receipt = Object.freeze({ state: "VERIFIED_CURRENT", exact_match_count: 1, duplicate_count: 0, credential_status: "VERIFIED_CURRENT", reconciliation_mode: mode, readback_sha256: digest([request.operation_sha256, request.binding_sha256, selected.vaultId, selected.id, after[0].item.version, mode]) });
        rejectPrivate(receipt);
        return receipt;
      } finally {
        material = null; identity = null; selected = null;
      }
    },
  });
}
