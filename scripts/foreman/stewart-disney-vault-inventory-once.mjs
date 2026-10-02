import { createClient } from "@1password/sdk";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { createOnePasswordServiceAccountClient } from "../../lib/harvey/onepassword-sdk-service-account-client.mjs";

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function disneySite(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (host === "disney.com" || host.endsWith(".disney.com") || host === "disneyplus.com" || host.endsWith(".disneyplus.com"));
  } catch { return false; }
}

/** Read-only, scope-limited inventory. Never fetches an item or its credential fields. */
export async function summarizeDisneyVaultInventory(client) {
  if (typeof client?.vaults?.list !== "function" || typeof client?.items?.list !== "function") fail("STEWART_DISNEY_VAULT_INVENTORY_CLIENT_INVALID");
  const vaults = await client.vaults.list();
  if (!Array.isArray(vaults) || vaults.some((vault) => typeof vault?.id !== "string" || !vault.id)) fail("STEWART_DISNEY_VAULT_INVENTORY_SCOPE_INVALID");
  let matching = 0; let active = 0; let archived = 0;
  for (const vault of vaults) {
    const overviews = await client.items.list(vault.id, { type: "ByState", content: { active: true, archived: true } });
    if (!Array.isArray(overviews)) fail("STEWART_DISNEY_VAULT_INVENTORY_UNPROVEN");
    for (const item of overviews) {
      if (item?.vaultId !== vault.id) fail("STEWART_DISNEY_VAULT_INVENTORY_DRIFT");
      if (item.category !== "Login" || !Array.isArray(item.websites) || !item.websites.some((site) => disneySite(site?.url))) continue;
      matching++;
      if (item.state === "active") active++;
      else if (item.state === "archived") archived++;
      else fail("STEWART_DISNEY_VAULT_INVENTORY_STATE_UNKNOWN");
    }
  }
  return Object.freeze({ schema: "pookakind.stewart-disney-vault-inventory/v1", state: "ACCESSIBLE_SCOPE_READ_ONLY", accessible_vault_count: vaults.length, disney_login_overview_count: matching, active_count: active, archived_count: archived, global_account_state_proved: false, secret_material_output: false });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { client } = await createOnePasswordServiceAccountClient({ createClient });
    process.stdout.write(`${JSON.stringify(await summarizeDisneyVaultInventory(client))}\n`);
  } catch (error) {
    process.stderr.write(`${typeof error?.code === "string" ? error.code : "STEWART_DISNEY_VAULT_INVENTORY_FAILED"}\n`);
    process.exitCode = 1;
  }
}
