# PACKET_TO_RECEIPT_TRACE_V0 Receipt

## TRACE COUNT

0

## SAMPLE TRACE

None. No complete `packet_id -> packet json -> packet_dispatched event -> receipt pickup -> receipt panel` loop is present in the current workspace evidence.

## PASS/FAIL

FAIL

- `node scripts\build-packet-receipt-trace.mjs` ran and wrote `foreman/artifacts/trace_report.json`.
- `node --check scripts\build-packet-receipt-trace.mjs` passed.
- `trace_report.json` shape check passed for the requested fields.
- No complete loop could be proven.

## BLOCKERS

- `data/organism/receipt_pickup.jsonl` is absent.
- No source packet JSON with a real `packet_id` was found outside the trace builder itself.
- No `packet_dispatched` event artifact was found outside the trace builder itself.
- No receipt pickup record could be linked to a packet.
- No cockpit/panel evidence could prove `visible_in_cockpit: true` for a packet receipt.
