# SPEAKER_TOPOLOGY_LOCK

Status: ACTIVE
Created: 2026-06-27T17:25:00-04:00
Owner: Speaker Substrate

## 1. Speaker Is Not An Aeye

Speaker is deterministic local file memory. Speaker is not an active LLM, router, builder, or autonomous agent.

Speaker stores, validates, indexes, and renders memory as files and SQLite rows. Any Aeye may read Speaker output, but Speaker itself does not infer missing context, call providers, route work, or rewrite history without source receipts.

## 1.1 PHYSICAL FORM ON DISK

```text
speaker/
  LOCKS/
    SPEAKER_TOPOLOGY_LOCK.md
  schemas/
    receipt.schema.json
    doctrine_unit.schema.json
  bin/
  db/
  receipts/
    raw/
    incoming/
    canonical/
    quarantine/
  doctrine/
    active/
    draft/
    superseded/
    index.md
  inheritance/
  bootloader/
    profiles/
  bootpacks/
    out/
  logs/
```

## 1.2 Boundary Rules

- Speaker may validate files against schema.
- Speaker may index deterministic records into SQLite.
- Speaker may render bootpacks from stored memory.
- Speaker may not act as an LLM.
- Speaker may not invent missing doctrine.
- Speaker may not ratify doctrine on Ben's behalf.
- Speaker may not delete malformed memory; it quarantines it with evidence.

## 1.3 Required Safety

Malformed memory must fail validation before it becomes canonical memory.

Receipts enter through `speaker/receipts/raw/` or `speaker/receipts/incoming/`, are validated against `speaker/schemas/receipt.schema.json`, and only then may be copied into `speaker/receipts/canonical/`.

Doctrine units must carry frontmatter fields enforced by `speaker/schemas/doctrine_unit.schema.json`, including `source_receipt_id` and `status`.
