# BIRD_0061 Maker Bootpack Injection Receipt

PACKET_ID: BIRD_0061_MAKER_BOOTPACK_INJECTION
TO: Maker@Betsy
STREAM: INFRASTRUCTURE / NERVOUS SYSTEM
STATUS: ARTIFACT
RECEIPT_ID: RECEIPT_BIRD_0061_MAKER_BOOTPACK_INJECTION_20260627
TIMESTAMP: 2026-06-27T21:10:30Z

## Artifact

Updated the local Aeye wrapper:

- `tinkarden/nervous_system/aeye_client.js`

Rendered local Speaker bootpacks for Maker and Dink:

- `speaker/bootloader/profiles/Maker.Betsy.json`
- `speaker/bootloader/profiles/Dink.Betsy.json`
- `speaker/bootpacks/out/Maker.Betsy.BOOTPACK.md`
- `speaker/bootpacks/out/Dink.Betsy.BOOTPACK.md`

Wrapper log:

- `tinkarden/nervous_system/aeye-wrapper-events.jsonl`

## Behavior

Before constructing any provider payload, the wrapper now reads:

```text
speaker/bootpacks/out/{Aeye}.{Machine}.{stream}.BOOTPACK.md
```

If missing, it injects:

```text
Speaker memory not loaded in this session.
```

The system prompt also includes the rule:

```text
You may not claim "Speaker told me", "Speaker believes", or "Speaker wants".
When citing Speaker memory, reference the bootpack text, heading, receipt, or lock directly.
```

## Bootpack Render Proof

```json
{
  "ok": true,
  "status": "ARTIFACT",
  "bootpack_path": "bootpacks/out/Maker.Betsy.BOOTPACK.md",
  "sections_rendered": ["topology_locks", "boundary_rules", "recent_artifact_receipts"]
}
```

```json
{
  "ok": true,
  "status": "ARTIFACT",
  "bootpack_path": "bootpacks/out/Dink.Betsy.BOOTPACK.md",
  "sections_rendered": ["topology_locks", "boundary_rules", "recent_artifact_receipts"]
}
```

## Injection Proof

Dry-run wrapper output for Maker:

```json
{
  "ok": true,
  "call_id": "aeye_call_20260627210926_97e501bd",
  "aeye": "Maker@Betsy",
  "status": "BOOTPACK_INJECTED_DRY_RUN_COMPLETE",
  "bootpack_loaded": true,
  "bootpack_path": "speaker/bootpacks/out/Maker.Betsy.BOOTPACK.md",
  "system_payload_contains_bootpack": true
}
```

Dry-run wrapper output for Dink:

```json
{
  "ok": true,
  "call_id": "aeye_call_20260627210926_e8834bd2",
  "aeye": "Dink@Betsy",
  "status": "BOOTPACK_INJECTED_DRY_RUN_COMPLETE",
  "bootpack_loaded": true,
  "bootpack_path": "speaker/bootpacks/out/Dink.Betsy.BOOTPACK.md",
  "system_payload_contains_bootpack": true
}
```

Wrapper log entries:

```json
{
  "event": "speaker_bootpack_injected",
  "call_id": "aeye_call_20260627210926_97e501bd",
  "aeye": "Maker@Betsy",
  "bootpack_loaded": true,
  "bootpack_path": "speaker/bootpacks/out/Maker.Betsy.BOOTPACK.md",
  "status": "BOOTPACK_INJECTED_DRY_RUN"
}
```

```json
{
  "event": "speaker_bootpack_injected",
  "call_id": "aeye_call_20260627210926_e8834bd2",
  "aeye": "Dink@Betsy",
  "bootpack_loaded": true,
  "bootpack_path": "speaker/bootpacks/out/Dink.Betsy.BOOTPACK.md",
  "status": "BOOTPACK_INJECTED_DRY_RUN"
}
```

SQLite payload proof:

```json
[
  {
    "call_id": "aeye_call_20260627210926_97e501bd",
    "aeye": "Maker@Betsy",
    "status": "BOOTPACK_INJECTED_DRY_RUN_COMPLETE",
    "active_context_path": "speaker/bootpacks/out/Maker.Betsy.BOOTPACK.md",
    "request_has_bootpack_begin": true,
    "request_has_bootpack_loaded_true": true
  },
  {
    "call_id": "aeye_call_20260627210926_e8834bd2",
    "aeye": "Dink@Betsy",
    "status": "BOOTPACK_INJECTED_DRY_RUN_COMPLETE",
    "active_context_path": "speaker/bootpacks/out/Dink.Betsy.BOOTPACK.md",
    "request_has_bootpack_begin": true,
    "request_has_bootpack_loaded_true": true
  }
]
```

Anti-claim rule proof:

```json
[
  {
    "aeye": "Maker@Betsy",
    "request_has_speaker_told_me_rule": true,
    "request_has_speaker_believes_rule": true,
    "request_has_reference_bootpack_rule": true
  },
  {
    "aeye": "Dink@Betsy",
    "request_has_speaker_told_me_rule": true,
    "request_has_speaker_believes_rule": true,
    "request_has_reference_bootpack_rule": true
  }
]
```

## Missing Bootpack Proof

```json
{
  "call_id": "aeye_call_20260627211030_7c080849",
  "active_context_path": "speaker/bootpacks/out/NoBootpack.Betsy.BOOTPACK.md",
  "request_has_missing_memory_sentence": true,
  "request_has_bootpack_loaded_false": true
}
```

## Notes

- This proof used `--dry-run`, so no external provider call or secret was required.
- The wrapper still builds the exact provider payload and records it in `aeye_api_calls`.
- `active_context_path` now stores the bootpack path for continuity with the existing SQLite table.
