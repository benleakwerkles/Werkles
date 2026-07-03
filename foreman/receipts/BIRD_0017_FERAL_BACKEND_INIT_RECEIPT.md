# BIRD_0017_FERAL_BACKEND_INIT_RECEIPT

STATUS: ARTIFACT

PACKET_ID: `BIRD_0017_FERAL_BACKEND_INIT`

STREAM: MUSCULATURE / CIRCULATION

OWNER: Maker@Betsy

ARTIFACTS:
- `tinkarden/server/index.js`
- `tinkarden/server/package.json`
- `tinkarden/server/package-lock.json`
- `tinkarden/server/circulation.db`

SERVER:
- Fastify on `127.0.0.1:4317`
- SQLite via `better-sqlite3`
- Database: `tinkarden/server/circulation.db`

TABLES:
- `shadow_cache`
- `receipts`

API PROOF:

```json
{
  "health_ok": true,
  "dry_run_status": "DRY_RUN_CACHED",
  "shadow_id": "shadow_20260627190801_6610ffe0",
  "unsigned_merge_blocked": true,
  "unsigned_merge_error": "{\"ok\":false,\"error\":\"OPERATOR_SIGNATURE_REQUIRED\"}",
  "merge_status": "SHADOW_MERGED_WITH_RECEIPT",
  "receipt_id": "receipt_20260627190801_827c570d",
  "receipt_lookup_ok": true,
  "receipt_status": "SHADOW_MERGED_WITH_RECEIPT"
}
```

GUARDRAIL:
- `shadow_merge` rejected missing `operator_signature`.
- Live merge wrote durable receipt before returning success.

BEN ACTION:
- None.

