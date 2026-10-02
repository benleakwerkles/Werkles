import assert from "node:assert/strict";
import test from "node:test";

import { summarizeDisneyVaultInventory } from "../stewart-disney-vault-inventory-once.mjs";

test("counts only Disney login overviews in the accessible vault scope without reading items", async () => {
  let itemReads = 0;
  const client = {
    vaults: { list: async () => [{ id: "scope-a" }, { id: "scope-b" }] },
    items: {
      list: async (vaultId) => vaultId === "scope-a"
        ? [{ vaultId, category: "Login", state: "active", websites: [{ url: "https://login.disney.com" }] }, { vaultId, category: "Login", state: "active", websites: [{ url: "https://example.invalid" }] }]
        : [{ vaultId, category: "Login", state: "archived", websites: [{ url: "https://www.disneyplus.com" }] }],
      get: async () => { itemReads++; throw new Error("PRIVATE_ITEM_READ_FORBIDDEN"); },
    },
  };
  const receipt = await summarizeDisneyVaultInventory(client);
  assert.deepEqual(receipt, { schema: "pookakind.stewart-disney-vault-inventory/v1", state: "ACCESSIBLE_SCOPE_READ_ONLY", accessible_vault_count: 2, disney_login_overview_count: 2, active_count: 1, archived_count: 1, global_account_state_proved: false, secret_material_output: false });
  assert.equal(itemReads, 0);
  assert.doesNotMatch(JSON.stringify(receipt), /scope-a|scope-b|login\.disney|disneyplus|password|token/i);
});

test("unknown state and inconsistent vault custody fail closed", async () => {
  const client = { vaults: { list: async () => [{ id: "scope" }] }, items: { list: async () => [{ vaultId: "other", category: "Login", state: "active", websites: [{ url: "https://login.disney.com" }] }] } };
  await assert.rejects(summarizeDisneyVaultInventory(client), /INVENTORY_DRIFT/);
  client.items.list = async () => [{ vaultId: "scope", category: "Login", state: "unknown", websites: [{ url: "https://login.disney.com" }] }];
  await assert.rejects(summarizeDisneyVaultInventory(client), /STATE_UNKNOWN/);
});
