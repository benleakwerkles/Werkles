# RECEIPT_STREAM_LIVE_DATA Receipt

Timestamp: 2026-06-23T19:45:00Z
Destination: TinkerDen Intake / Speaker

## Files

- `data/organism/receipt_pickup.jsonl`
- `foreman/receipts/RECEIPT_STREAM_LIVE_DATA_RECEIPT.md`

## UI Path

- `/tinkerden`

## Source Stream

- `data/organism/receipt_pickup.jsonl`

## Rows Displayed

- `FilesystemDropProof@Betsy` / `birdie_packet_example_001` / `UNKNOWN`
- `Maker@Betsy` / `td_packet_returned_001` / `UNKNOWN`
- `Dink@Betsy` / `packet_mqle8l45_bwhh1a` / `ACKNOWLEDGED`

## Screenshot

- `receipt-stream-live-data-rows.png`

## Pass / Fail

PASS.

## Blockers

- No cockpit display blocker. The panel now shows real rows instead of `No receipt pickup stream found.`
- Some source receipts have no explicit status field; those rows preserve `UNKNOWN`.
