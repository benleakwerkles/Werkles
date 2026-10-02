import { createHash } from "node:crypto";

const TOKEN_ENV = "OP_SERVICE_ACCOUNT_TOKEN";
const OFFICIAL_CLIENT_RECEIPTS = new WeakMap();
function fail(code) { const error = new Error(code); error.code = code; throw error; }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value)) freeze(child); return Object.freeze(value); }

export async function createOnePasswordServiceAccountClient({ createClient, env = process.env, integrationName = "PookaKind Password Automatica", integrationVersion = "1" }) {
  if (typeof createClient !== "function" || !env || typeof integrationName !== "string" || typeof integrationVersion !== "string") fail("ONEPASSWORD_SDK_CLIENT_FACTORY_INVALID");
  let token = env[TOKEN_ENV];
  if (typeof token !== "string" || token.length < 32) fail("ONEPASSWORD_SDK_SERVICE_ACCOUNT_TOKEN_UNAVAILABLE");
  try {
    const client = await createClient({ auth: token, integrationName, integrationVersion });
    if (typeof client?.items?.get !== "function" || typeof client?.items?.put !== "function" || typeof client?.vaults?.list !== "function") fail("ONEPASSWORD_SDK_CLIENT_INVALID");
    const clientInstanceSha256 = createHash("sha256").update(JSON.stringify(["pookakind.onepassword-sdk-client/v1", integrationName, integrationVersion, process.platform, process.arch])).digest("hex");
    const receipt = freeze({ schema: "pookakind.onepassword-sdk-client-receipt/v1", authentication_mode: "SERVICE_ACCOUNT", token_source: "PROCESS_ENVIRONMENT_EPHEMERAL", token_cleared_after_creation: true, client_instance_sha256: clientInstanceSha256, secret_material_output: false });
    OFFICIAL_CLIENT_RECEIPTS.set(client, receipt);
    return Object.freeze({ client, receipt });
  } finally {
    token = null;
    delete env[TOKEN_ENV];
  }
}

export function verifyOnePasswordServiceAccountClientReceipt(client, receipt) {
  if (!client || typeof client !== "object" || OFFICIAL_CLIENT_RECEIPTS.get(client) !== receipt) fail("ONEPASSWORD_SDK_CLIENT_RECEIPT_NOT_OFFICIAL");
  return receipt;
}

export const ONEPASSWORD_SERVICE_ACCOUNT_TOKEN_ENV = TOKEN_ENV;
