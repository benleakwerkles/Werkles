import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(new URL(`../../../${file}`, import.meta.url), "utf8");

test("private Harvey routes browser commands to the server-only cloud relay", async () => {
  const [route, bridge, relay] = await Promise.all([
    read("app/api/harvey/work-orders/route.ts"),
    read("app/harvey/operator-bridge.ts"),
    read("lib/harvey/cloud-relay.ts")
  ]);
  assert.match(route, /harveyPrivateApiGate/);
  assert.match(route, /harveyPrivateSameOrigin/);
  assert.match(route, /enqueueHarveyCloudCommand/);
  assert.match(bridge, /mode: "HARVEY_CLOUD"/);
  assert.match(relay, /^import "server-only";/);
  assert.doesNotMatch(bridge, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("relay migration is service-only and preserves receipt truth", async () => {
  const migration = await read("supabase/migrations/20260718024422_harvey_cloud_relay.sql");
  for (const table of ["recipients", "receivers", "receiver_routes", "commands", "deliveries", "receipts"]) {
    assert.match(migration, new RegExp(`alter table public\\.harvey_relay_${table} enable row level security`, "i"));
    assert.match(migration, new RegExp(`revoke all on public\\.harvey_relay_${table} from public, anon, authenticated`, "i"));
  }
  assert.match(migration, /on conflict on constraint harvey_relay_deliveries_command_recipient_key do nothing/i);
  assert.match(migration, /for update of delivery skip locked/i);
  assert.match(migration, /HARVEY_SUBMISSION_CONFLICT/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /HARVEY_COMMAND_RATE_LIMIT/);
  assert.match(migration, /Receiver claimed the Harvey inbox delivery/);
  assert.match(migration, /QUEUED is not RECEIVED and CLAIMED is not COMPLETED/);
  assert.match(migration, /HARVEY_RECEIVER_MACHINE_BINDING_INVALID/);
  assert.match(migration, /HARVEY_RECEIVER_ROUTE_BINDING_INVALID/);
  assert.match(migration, /receiver_route\.receiver_id = p_receiver_id/);
  assert.match(migration, /revoke all on function public\.harvey_claim_deliveries\([^;]+from service_role/i);
  assert.doesNotMatch(migration, /grant execute on function public\.harvey_claim_deliveries\([^;]+to service_role/i);
  assert.doesNotMatch(migration, /grant[^;]*(?:update|delete)[^;]*harvey_relay_receipts/i);
});

test("command deck labels inbox delivery separately from Aeye receipt", async () => {
  const deck = await read("app/harvey/HarveyCommandDeck.tsx");
  assert.match(deck, /DELIVERED TO HARVEY INBOXES/);
  assert.match(deck, /Inbox delivery is proven; Aeye receipt is not claimed until pickup/);
  assert.match(deck, /claimed.*working\/replied.*completed.*blocked.*awaiting a receiver/);
  assert.match(deck, /Do not paste passwords, codes, tokens, recovery keys/);
  assert.match(deck, /HARVEY_HTTP_\$\{response\.status\}_NON_JSON/);
});
