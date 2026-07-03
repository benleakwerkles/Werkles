# SHAKESPEARE_THREAD_VENT_V0_RECEIPT

## Built

- Added local Shakespeare thread vent classifier.
- Added local API route at `/api/shakespeare/thread-vent`.
- Output includes `THREAD_STATUS`, `REBOOT_REQUIRED`, and `COMPACT_REBOOT_PACKET`.

## Trigger Coverage

- Thread length: turn count and token estimate.
- Response latency: absolute latency and baseline ratio.
- Role/machine context miss.
- Repeated settled doctrine.
- Vague receipts.
- User correction count greater than 2.

## Proof Scenario

Input:

```json
{
  "mission": "SHAKESPEARE_THREAD_VENT_V0",
  "role": "DINK",
  "machine": "SALLY",
  "executionContext": "LOCAL_SALLY_WINDOWS",
  "turnCount": 122,
  "responseLatencyMs": 92000,
  "baselineLatencyMs": 22000,
  "missedRoleMachineContextCount": 2,
  "repeatedSettledDoctrineCount": 2,
  "vagueReceiptCount": 2,
  "userCorrectionCount": 3
}
```

Expected receipt:

```text
THREAD_STATUS: STOP
REBOOT_REQUIRED: true
COMPACT_REBOOT_PACKET: includes mission, role, machine, execution context, vent reasons, latest state, next action, carry-forward, and drop lines.
```
