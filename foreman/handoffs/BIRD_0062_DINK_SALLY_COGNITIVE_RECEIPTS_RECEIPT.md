# BIRD_0062 Dink Sally Cognitive Receipts Receipt

PACKET_ID: BIRD_0062_DINK_SALLY_COGNITIVE_RECEIPTS

TO: Dink@Sally

STREAM: BUILD / VALIDATION PIPELINE

## ARTIFACT

- `receipt_formatter.js`
- `speaker/receipts/raw/inbox/rcpt_thufir_6aa922cec64f6e6b08f52c09.json`

## FILES

- `receipt_formatter.js` - deterministic Node formatter for Sally Aeye markdown/text outputs.
- `speaker/schemas/receipt.schema.json` - local Speaker raw receipt schema used for validation.
- `speaker/receipts/raw/inbox/rcpt_thufir_6aa922cec64f6e6b08f52c09.json` - schema-valid Speaker receipt generated from the local Thufir validation brief.
- `tinkarden/validation/BIRD_0062_thufir_validation_brief.md` - local Thufir validation fixture used as the source artifact because no pre-existing Thufir or Bean output was present.

## SAMPLE OUTPUT

```json
{
  "receipt_id": "rcpt_thufir_6aa922cec64f6e6b08f52c09",
  "receipt_type": "DECISION",
  "source": {
    "aeye": "Thufir",
    "machine": "Sally",
    "path": "tinkarden/validation/BIRD_0062_thufir_validation_brief.md"
  },
  "metadata": {
    "packet_id": "BIRD_0062_DINK_SALLY_COGNITIVE_RECEIPTS",
    "formatter": "receipt_formatter.js",
    "schema_id": "speaker.receipt.schema.v1"
  }
}
```

## VERIFICATION

PASS:

- `node --check receipt_formatter.js`
- `node receipt_formatter.js --input tinkarden/validation/BIRD_0062_thufir_validation_brief.md --aeye Thufir --receipt-type DECISION`
- `node receipt_formatter.js --validate speaker/receipts/raw/inbox/rcpt_thufir_6aa922cec64f6e6b08f52c09.json`

## BLOCKERS

- No pre-existing `speaker/schemas/receipt.schema.json` was present in this checkout; this packet created the local canonical schema file.
- No pre-existing Thufir or Bean report was present in this checkout; the validated inbox receipt was generated from a local Thufir validation fixture.
