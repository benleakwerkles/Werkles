# BIRD_0058 Maker Speaker Apply Apoptosis Receipt

PACKET_ID: BIRD_0058_MAKER_SPEAKER_APPLY_APOPTOSIS
TO: Maker@Betsy
STREAM: INFRASTRUCTURE / LYMPHATIC SYSTEM
STATUS: ARTIFACT
RECEIPT_ID: RECEIPT_BIRD_0058_MAKER_SPEAKER_APPLY_APOPTOSIS_20260627
TIMESTAMP: 2026-06-27T21:02:57Z

## Artifact

Added deterministic doctrine mortality support to:

- `speaker/bin/speakerctl.js`

Updated deterministic validation status lists:

- `speaker/schemas/doctrine_unit.schema.json`
- `speaker/bin/speaker-validate.sh`

Proof fixtures:

- `speaker/patches/BIRD_0058_APOPTOSIS_PATCH.json`
- `speaker/patches/BIRD_0058_HARD_DELETE_BLOCKED_PATCH.json`
- `speaker/receipts/canonical/receipt_bird_0058_operator_approval.json`
- `speaker/doctrine/graveyard/BIRD_0058_APOPTOSIS_PROOF.md`

## Successful Apoptosis Proof

Command:

```text
node speaker/bin/speakerctl.js apply-apoptosis --patch speaker/patches/BIRD_0058_APOPTOSIS_PATCH.json --approval-receipt receipt_bird_0058_operator_approval
```

Output:

```json
{
  "ok": true,
  "status": "APOPTOSIS_APPLIED",
  "outcome": "GRAVEYARD",
  "doctrine_id": "BIRD_0058_APOPTOSIS_PROOF",
  "source_path": "doctrine/active/BIRD_0058_APOPTOSIS_PROOF.md",
  "destination_path": "doctrine/graveyard/BIRD_0058_APOPTOSIS_PROOF.md",
  "operator_approval_receipt_id": "receipt_bird_0058_operator_approval",
  "ledger_id": "graveyard_20260627210257_BIRD_0058_APOPTOSIS_PROOF",
  "doctrine_index_rows": 1
}
```

## SQLite Ledger Proof

`graveyard_ledger` row:

```json
{
  "ledger_id": "graveyard_20260627210257_BIRD_0058_APOPTOSIS_PROOF",
  "doctrine_id": "BIRD_0058_APOPTOSIS_PROOF",
  "source_path": "doctrine/active/BIRD_0058_APOPTOSIS_PROOF.md",
  "destination_path": "doctrine/graveyard/BIRD_0058_APOPTOSIS_PROOF.md",
  "outcome": "GRAVEYARD",
  "reason": "Proof doctrine has served its purpose and should be retained as mortality evidence rather than remaining active.",
  "operator_approval_receipt_id": "receipt_bird_0058_operator_approval"
}
```

`doctrine_index` row:

```json
{
  "doctrine_id": "BIRD_0058_APOPTOSIS_PROOF",
  "path": "doctrine/graveyard/BIRD_0058_APOPTOSIS_PROOF.md",
  "status": "GRAVEYARD",
  "source_receipt_id": "receipt_bird_0058_operator_approval"
}
```

## Hard Delete Block Proof

Command:

```text
node speaker/bin/speakerctl.js apply-apoptosis --patch speaker/patches/BIRD_0058_HARD_DELETE_BLOCKED_PATCH.json --approval-receipt receipt_bird_0058_operator_approval
```

Output:

```json
{
  "ok": false,
  "status": "ERROR",
  "error": "HARD_DELETE_FORBIDDEN"
}
```

Terminal also reported:

```text
HARD_DELETE_BLOCK_EXIT_CODE=1
```

## Safety Notes

- `speakerctl.js` now rejects `HARD_DELETE`.
- The command requires both `--patch` and `--approval-receipt`.
- The approval receipt must exist under Speaker receipts.
- The moved doctrine file retained frontmatter and gained `status: GRAVEYARD`, `operator_approval_receipt_id`, `apoptosis_reason`, and `apoptosis_applied_at`.
- `speakerctl.js` contains no `fs.unlinkSync`, `fs.rmSync`, or shell `rm` primitive after this change.
