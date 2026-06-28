# Speaker Deterministic Ingestion V0

This local Speaker gate validates raw JSON receipts without using an LLM.

## Commands

```powershell
node C:\speaker\bin\speakerctl.js ingest C:\path\to\receipt.json
node C:\speaker\bin\speakerctl.js render-bootpack Skybro.Betsy
node C:\speaker\bin\speakerctl.js queue-apoptosis <receipt_id>
node C:\speaker\bin\speakerctl.js export-apoptosis <queue_id>
node C:\speaker\bin\speakerctl.js apply-apoptosis C:\path\to\apoptosis_patch.json C:\path\to\operator_approval_receipt.json
& 'C:\Program Files\Git\bin\bash.exe' C:\speaker\bin\sync-keyrings.sh
```

## Behavior

- Valid receipts are copied into `C:\speaker\receipts\canonical\`.
- Invalid receipts are moved into `C:\speaker\receipts\quarantine\`.
- Every attempt appends one JSONL line to `C:\speaker\logs\ingest.jsonl`.
- The script does not guess, repair, rewrite, or soften receipt meaning.
- `render-bootpack` reads `C:\speaker\bootloader\profiles\<Aeye>.<Machine>.json`,
  queries `C:\speaker\speaker.sqlite`, and writes deterministic Markdown to
  `C:\speaker\bootpacks\out\`.
- Bootpack rendering follows the profile `priority_order` only; unknown priority
  keys are blockers, not guesses.
- Apoptosis commands queue a receipt, export an Ender bundle, require a
  pre-written patch plus Operator Approval Receipt, and then write the
  `graveyard_ledger`.
- `sync-keyrings.sh` imports `C:\speaker\LOCKS\operator_pubkey.asc` into
  `C:\speaker\LOCKS\operator_pubkey.gpg` only after the public key and its
  `operator_pubkey.asc.sha256` pin are both present, hash-matching, and
  Git-tracked. Speaker Git `post-merge` and `post-checkout` hooks call this
  provisioner after repository sync events.

## V0 E2E Test

```powershell
& 'C:\Program Files\Git\bin\bash.exe' C:\speaker\test_v0_organism.sh
```

The test is deterministic local execution only. It does not call an active LLM.

## Current Schema Requirements

- `receipt_id`
- `packet_id`
- `status`
- `evidence`

`status` must be one of:

- `ACK`
- `ARTIFACT`
- `BLOCKER`
- `RECEIPT_PROVEN`
- `PASS`
- `FAIL`

Vague status words such as `fixed`, `done`, `handled`, `sent`, or `looks good` are rejected.
