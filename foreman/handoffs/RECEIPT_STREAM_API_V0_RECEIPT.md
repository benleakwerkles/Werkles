# RECEIPT_STREAM_API_V0 Receipt

## FILES

- `lib/tinkerden-receipt-stream.ts`
- `app/api/tinkerden/receipts/route.ts`
- `foreman/handoffs/RECEIPT_STREAM_API_V0_RECEIPT.md`

## API PATH

`GET /api/tinkerden/receipts`

## SAMPLE RESPONSE

```json
{
  "source": "data/organism/receipt_pickup.jsonl",
  "source_exists": false,
  "limit": 10,
  "count": 0,
  "records": [],
  "blocker": "data/organism/receipt_pickup.jsonl not found"
}
```

## PASS/FAIL

PASS

- `npm.cmd run typecheck` passed.
- Local route load passed at `http://127.0.0.1:3005/api/tinkerden/receipts`.
- Route is read-only and only reads `data/organism/receipt_pickup.jsonl`.
- Missing input does not invent status or receipt records.
- Parsed records are returned as-is, so `UNKNOWN` stays `UNKNOWN`.

## BLOCKERS

- `data/organism/receipt_pickup.jsonl` is not present in this workspace, so the live sample response has zero records.
