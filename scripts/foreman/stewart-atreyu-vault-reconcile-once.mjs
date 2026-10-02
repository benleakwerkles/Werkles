import { createHash } from "node:crypto";
import { closeSync, mkdirSync, openSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@1password/sdk";

import { reconcileAtreyuVaultCredential } from "../../lib/harvey/atreyu-vault-reconciliation.mjs";

const HASH = /^[a-f0-9]{64}$/;
function fail(code) { const error = new Error(code); error.code = code; throw error; }

const env = process.env;
let token = env.OP_SERVICE_ACCOUNT_TOKEN;
let material = env.PK_BLIND_MASTER_MATERIAL;
const provider = env.PK_ATREYU_PROVIDER;
const vaultId = env.PK_ATREYU_VAULT_ID;
const itemId = env.PK_ATREYU_ITEM_ID;
const expectedVaultRefSha256 = env.PK_ATREYU_VAULT_REF_SHA256;
const expectedItemRefSha256 = env.PK_ATREYU_ITEM_REF_SHA256;
const requestSha256 = env.PK_ATREYU_REQUEST_SHA256;
const authority = env.PK_PASSWORD_AUTOMATICA_AUTHORITY;
const consumptionRoot = env.PK_ATREYU_CONSUMPTION_ROOT || join(env.LOCALAPPDATA || ".", "PookaKind", "AtreyuVaultReconciler", "consumed");

for (const key of ["OP_SERVICE_ACCOUNT_TOKEN", "PK_BLIND_MASTER_MATERIAL", "PK_ATREYU_VAULT_ID", "PK_ATREYU_ITEM_ID"]) delete env[key];

let claim;
try {
  if (typeof token !== "string" || token.length < 32) fail("ATREYU_VAULT_SERVICE_TOKEN_UNAVAILABLE");
  if (typeof material !== "string" || material.length < 1) fail("ATREYU_VAULT_MATERIAL_UNAVAILABLE");
  if (!HASH.test(requestSha256 ?? "")) fail("ATREYU_VAULT_REQUEST_INVALID");
  if (authority !== "OPERATOR_APPROVED_ATREYU_EXACT_VAULT_RECONCILIATION") fail("ATREYU_VAULT_AUTHORITY_MISSING");

  mkdirSync(consumptionRoot, { recursive: true });
  try {
    claim = openSync(join(consumptionRoot, `${requestSha256}.used`), "wx");
    writeFileSync(claim, "CONSUMED_ONCE", { encoding: "utf8" });
  } catch (error) {
    if (error?.code === "EEXIST") fail("ATREYU_VAULT_REQUEST_ALREADY_CONSUMED");
    throw error;
  } finally {
    if (claim !== undefined) closeSync(claim);
    claim = undefined;
  }

  const client = await createClient({ auth: token, integrationName: "PookaKind Password Automatica", integrationVersion: "1" });
  token = null;
  const receipt = await reconcileAtreyuVaultCredential({ client, provider, vaultId, itemId, expectedVaultRefSha256, expectedItemRefSha256, material });
  process.stdout.write(JSON.stringify({ ...receipt, request_sha256: requestSha256, claim_consumed: true, recurring_operation_created: false }));
} catch (error) {
  process.stderr.write(String(error?.code ?? "ATREYU_VAULT_RECONCILIATION_FAILED"));
  process.exitCode = 1;
} finally {
  token = null;
  material = null;
  for (const key of ["OP_SERVICE_ACCOUNT_TOKEN", "PK_BLIND_MASTER_MATERIAL", "PK_ATREYU_PROVIDER", "PK_ATREYU_VAULT_ID", "PK_ATREYU_ITEM_ID", "PK_ATREYU_VAULT_REF_SHA256", "PK_ATREYU_ITEM_REF_SHA256", "PK_ATREYU_REQUEST_SHA256", "PK_PASSWORD_AUTOMATICA_AUTHORITY", "PK_ATREYU_CONSUMPTION_ROOT"]) delete env[key];
}
