# CHOKIDAR_V0_BUILD_RECEIPT

Mission: CHOKIDAR_V0_BUILD
Created: 2026-06-23
Status: READY
Detected by: Maker@Betsy

## Files Changed

- `scripts/foreman/chokidar-neurocirculymphatic-v0.mjs`
- `package.json`
- `package-lock.json`
- `data/organism/events.jsonl`
- `foreman/receipts/CHOKIDAR_NEUROCIRCULYMPHATIC_V0_TEST_RECEIPT.json`
- `foreman/receipts/CHOKIDAR_NEUROCIRCULYMPHATIC_V0_RECEIPT.md`
- `foreman/receipts/CHOKIDAR_V0_BUILD_RECEIPT.md`

## Command To Run

```powershell
npm run organism:watch
```

## Watches

- `foreman/handoffs/outbox`
- `foreman/handoffs/inbox`
- `foreman/receipts`
- `foreman/speaker/entries`

`speaker/inbox` was not present; `foreman/speaker/entries` is the current Speaker intake-like folder.

## Output

`data/organism/events.jsonl`

## Sample Event

```json
{"timestamp":"2026-06-23T06:24:02.767Z","event_type":"file_created","source_path":"foreman/receipts/CHOKIDAR_NEUROCIRCULYMPHATIC_V0_TEST_RECEIPT.json","file_name":"CHOKIDAR_NEUROCIRCULYMPHATIC_V0_TEST_RECEIPT.json","detected_by":"Maker@Betsy","destination_guess":"foreman_receipts","sha256":"96ff2d67959aca79bf972b717a3ff07a589bedf7f51b30afdaca877eec9ed90c","size_bytes":164}
```

## Blocker

Default sandboxed background launch failed on Windows because the filesystem sandbox was unavailable. Running with local filesystem permission succeeded. No MQTT, vector DB, dashboard, or architecture expansion was added.
