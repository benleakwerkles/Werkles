# BIRD_0052 Maker Speaker Substrate Receipt

PACKET_ID: BIRD_0052_MAKER_SPEAKER_SUBSTRATE
TO: Maker@Betsy
STREAM: INFRASTRUCTURE / MEMORY
STATUS: ARTIFACT
RECEIPT_ID: RECEIPT_BIRD_0052_MAKER_SPEAKER_SUBSTRATE_20260627
TIMESTAMP: 2026-06-27T20:47:00Z

## Artifact

Built and completed the deterministic Speaker memory substrate under `/speaker/`.

Created or completed:

- `speaker/LOCKS/SPEAKER_TOPOLOGY_LOCK.md`
- `speaker/schemas/receipt.schema.json`
- `speaker/schemas/doctrine_unit.schema.json`
- `speaker/db/`
- `speaker/receipts/raw/`
- `speaker/doctrine/active/`
- `speaker/doctrine/draft/`
- `speaker/doctrine/superseded/`

No LLM integration script was added for this packet.

## Schema Proof

`receipt.schema.json` enforces:

- `receipt_id`
- `receipt_type`
- `timestamp`
- `owner`
- `status`
- `evidence`

`doctrine_unit.schema.json` enforces frontmatter-style fields:

- `doctrine_id`
- `title`
- `status`
- `source_receipt_id`
- `created_at`
- `owner`

JSON parse proof:

```text
speaker substrate files parse/presence ok
```

## Tree Proof

Command:

```text
tree /A /F speaker
```

Output:

```text
Folder PATH listing
Volume serial number is 000001A6 307D:A9DC
C:\USERS\BEN LEAK\DESKTOP\GITHUB\WERKLES\SPEAKER
|   speaker.sqlite
|
+---bin
|       speakerctl.js
|
+---bootloader
|   \---profiles
|           Skybro.Betsy.json
|
+---bootpacks
|   \---out
|           Skybro.Betsy.BOOTPACK.md
|
+---db
|       .gitkeep
|
+---doctrine
|   |   index.md
|   |
|   +---active
|   |       .gitkeep
|   |
|   +---draft
|   |       .gitkeep
|   |
|   \---superseded
|           .gitkeep
|
+---inheritance
|       inheritance_ledger.json
|
+---LOCKS
|       SPEAKER_TOPOLOGY_LOCK.md
|
+---logs
|       ingest.jsonl
|
+---receipts
|   +---canonical
|   |       receipt_bird_0053_valid_mock.5fbd8ed24e7ea62b26b146d2ec5e575894a6df19f623e32d72fcae14b06f47d6.json
|   |
|   +---incoming
|   |       mock_valid_bird_0053.json
|   |
|   +---quarantine
|   |       receipt_bird_0053_malformed_mock.931a724dc98441cfee33bb84d3e1e4694f7d3b7db47a3d11cf158f6addeba207.json
|   |
|   \---raw
|           .gitkeep
|
\---schemas
        doctrine_unit.schema.json
        receipt.schema.json
```

## Notes

- `speaker/` already contained deterministic ingestion and bootpack artifacts from adjacent Speaker substrate work.
- This packet completed the topology required by the lock and added the missing schema and folder lanes.
- The intentionally malformed quarantine receipt remains malformed by design.
