# STATUS_RAIL_V0 Receipt

Destination: TinkerDen Intake / Speaker

## DATA SOURCE

Receipt artifacts only:

- Markdown or JSON handoff artifacts under `foreman/handoffs/` whose filename contains `RECEIPT`.
- Receipt objects recorded in `foreman/artifacts/ARTIFACT_REGISTRY_V0.json`.

Non-receipt status files, chat memory, optimistic assumptions, and live app state are not used.

## STATUS MAPPING

| Display status | Required receipt proof |
| --- | --- |
| `DISPATCHED` | Explicit `DISPATCHED`, `Destination:`, or standalone `DESTINATION` evidence in a receipt without stronger returned/blocked proof. |
| `RECEIVED` | Explicit `RECEIVED` / `received` evidence in a receipt without stronger returned/blocked proof. |
| `WORKING` | Explicit `WORKING` / `## Working` evidence in a receipt without stronger returned/blocked proof. |
| `BLOCKED` | Explicit `FAIL`, `PASS/FAIL: FAIL`, `Status: BLOCKED`, `BLOCKED`, or non-empty `## Blocked / Pending` evidence. |
| `RECEIPT_RETURNED` | Explicit `PASS`, `PASS/FAIL: PASS`, receipt-confirmation text, verification text, or registry receipt presence for non-`WATCH` registry entries. |
| `UNKNOWN` | Proof absent or registry receipt is `WATCH`; no optimistic status is inferred. |

Precedence: `BLOCKED`, `RECEIPT_RETURNED`, `RECEIVED`, `WORKING`, `DISPATCHED`, then `UNKNOWN`.

## PASS/FAIL

PASS

- `node scripts\build-status-rail.mjs` wrote 10 status rail entries to `foreman/artifacts/status_rail_v0.json`.
- Shape check passed: every status is one of `DISPATCHED`, `RECEIVED`, `WORKING`, `BLOCKED`, `RECEIPT_RETURNED`, or `UNKNOWN`.
- Source check passed: every entry came from a receipt-named handoff artifact or `foreman/artifacts/ARTIFACT_REGISTRY_V0.json` receipt object.
- Evidence check passed: every entry includes the receipt line or `proof absent`.
- Generated status counts: `UNKNOWN` 3, `RECEIPT_RETURNED` 6, `BLOCKED` 1.
