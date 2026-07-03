# BIRD_0042 Dink Sally Validation Pipeline Receipt

PACKET_ID: BIRD_0042_DINK_SALLY_VALIDATION_PIPELINE

TO: Dink@Sally

STREAM: BUILD / VALIDATION PIPELINE

## ARTIFACT

- `sally_circulator.js`

## FILES

- `sally_circulator.js` - dependency-free Node watcher and POST retry queue for Sally-side report circulation.

## BEHAVIOR

- Watches repo-relative `tinkarden/validation/` for Thufir markdown reports.
- Watches repo-relative `tinkarden/attack/` for Bean markdown reports.
- Creates the watched directories at runtime if they are absent.
- Parses only configured operational flag tokens from markdown; default tokens include `THREAT_DETECTED` and `VALIDATION_FAILED`.
- Persists local file fingerprints, pending events, and sent-event receipts in `tinkarden/.sally_circulator_state.json` at runtime.
- Sends queued state updates by POST to a configured Doss endpoint.
- Defaults to a dedicated telemetry path: `/v1/telemetry/sally_circulation`.
- Supports `/v1/action/shadow_merge` only when `SALLY_DRY_RUN_RECEIPT_ID` is provided, preserving the existing contract requirement for a prior dry-run receipt.

## VERIFICATION

PASS:

- `node --check sally_circulator.js`
- `node sally_circulator.js --self-test`

## BLOCKERS

- Live Doss POST was not attempted because neither `SALLY_CIRCULATOR_ENDPOINT` nor `DOSS_IP` is present in the current environment.
- PM2 registration was not performed because `pm2` is not installed/discoverable in the current shell.
- The existing `/v1/action/shadow_merge` contract requires a prior dry-run receipt id; using that endpoint live requires `SALLY_DRY_RUN_RECEIPT_ID`.
