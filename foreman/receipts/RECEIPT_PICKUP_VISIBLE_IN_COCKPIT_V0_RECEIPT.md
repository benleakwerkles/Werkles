# RECEIPT_PICKUP_VISIBLE_IN_COCKPIT_V0 Receipt

Timestamp: 2026-06-23T15:53:00Z
Destination: TinkerDen Intake / Speaker

## FILES

- `app/tinkerden/page.tsx`
- `app/globals.css`
- `foreman/receipts/RECEIPT_PICKUP_VISIBLE_IN_COCKPIT_V0_RECEIPT.md`

## UI PATH

- `/tinkerden`

## SAMPLE RECEIPT DISPLAYED

- Source stream checked: `data/organism/receipt_pickup.jsonl`
- Current display: `No receipt pickup stream found.`
- No sample receipt data was fabricated because the mission is read-only and the source file is currently missing.

## PASS/FAIL

PASS.

## BLOCKERS

- Input stream `data/organism/receipt_pickup.jsonl` is missing, so the cockpit shows the required missing-stream message.
- `npm run typecheck` reaches the existing unrelated `tools/operator_assist/src/index.ts` `.ts` extension import blocker.
