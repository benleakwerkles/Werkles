# BIRD_0027 Maker Engine Room UI Receipt

PACKET_ID: BIRD_0027_MAKER_ENGINE_ROOM_UI
TO: Maker@Betsy
STREAM: BUILD / UI
STATUS: ARTIFACT
RECEIPT_ID: RECEIPT_BIRD_0027_MAKER_ENGINE_ROOM_UI_20260627
TIMESTAMP: 2026-06-27T20:26:53Z

## Artifact

Built a visible primary-deck Engine Room pane for the Feral Membrane.

Changed files:

- `tinkarden/server/index.js`
- `tinkarden/membrane/app/EngineRoom.tsx`
- `tinkarden/membrane/app/page.tsx`

## Backend Proof

Seeded one real dry-run packet through the Fastify backend:

```json
{
  "ok": true,
  "status": "DRY_RUN_CACHED",
  "shadow_id": "shadow_20260627202335_a0eea499",
  "created_at": "2026-06-27T20:23:35.260Z"
}
```

Verified `/v1/engine-room` returned the in-flight packet:

```json
{
  "ok": true,
  "in_flight": [
    {
      "shadow_id": "shadow_20260627202335_a0eea499",
      "status": "WAITING_FOR_MERGE",
      "target_aeye": "Maker@Betsy",
      "action": "engine_room_packet",
      "stalled": false
    }
  ]
}
```

## DOM Snapshot Proof

Browser DOM text from `article[aria-label="Engine Room EXECUTION"]`:

```text
ENGINE ROOM — EXECUTION

Packets In Flight
1
POLLING LIVE
SHADOW_CACHE / ACTIVE EXECUTION
FRICTIONAL HEAT: SOURCE MISSING

TARGET AEYE

Maker@Betsy
3M 18S
ACTION
engine_room_packet
STATUS
WAITING_FOR_MERGE

shadow_20260627202335_a0eea499

DRY RUN ONLY: would stage engine_room_packet.
```

## Notes

- The Engine Room is not a modal; it is visible in the primary flight deck.
- The client component continuously polls `/api/feral/v1/engine-room`, which forwards to the live Fastify backend at `127.0.0.1:4317`.
- The server endpoint reads `shadow_cache` and checks `frictional_heat.json` when present. No `frictional_heat.json` source existed during this proof, so the packet rendered as non-stalled.
