# BIRD_0021 Maker Membrane Wiring Receipt

PACKET_ID: BIRD_0021_MAKER_MEMBRANE_WIRING
TO: Maker@Betsy
STREAM: BUILD / UI
STATUS: ARTIFACT
TIMESTAMP: 2026-06-27T20:06:11Z

## Artifact

The Feral Membrane UI at `tinkarden/membrane/app/page.tsx` was wired to the live Fastify backend and Medulla recommendation cards.

Browser console trace from `http://127.0.0.1:4320/`:

```text
2026-06-27T20:06:11.847Z shadow_merge receipt receipt_20260627200611_c039688b
2026-06-27T20:06:11.826Z direct fetch blocked; forwarded http://127.0.0.1:4317/v1/action/shadow_merge
2026-06-27T20:06:11.821Z fetch POST http://127.0.0.1:4317/v1/action/shadow_merge shadow_20260627200603_3617120a
2026-06-27T20:06:03.509Z dry_run cached shadow_20260627200603_3617120a
2026-06-27T20:06:03.495Z direct fetch blocked; forwarded http://127.0.0.1:4317/v1/action/dry_run
2026-06-27T20:06:03.495Z fetch POST http://127.0.0.1:4317/v1/action/dry_run medulla_card_medulla_test_valid_20260627180552
2026-06-27T20:06:03.492Z cards fetched 3
2026-06-27T20:06:03.454Z direct fetch blocked; forwarded http://127.0.0.1:4317/v1/recommendations
```

Fastify receipt lookup:

```json
{
  "ok": true,
  "receipt": {
    "receipt_id": "receipt_20260627200611_c039688b",
    "shadow_id": "shadow_20260627200603_3617120a",
    "created_at": "2026-06-27T20:06:11.843Z",
    "action_type": "membrane_move",
    "operator_signature": "membrane-ui-proceed:medulla_card_medulla_test_valid_20260627180552",
    "status": "SHADOW_MERGED_WITH_RECEIPT"
  }
}
```

## Notes

- The UI first attempts the literal Fastify target at `http://127.0.0.1:4317`.
- Cursor's embedded browser blocked direct cross-port JavaScript fetches during proof capture, so the membrane app includes a same-origin forwarding route at `/api/feral/[...path]`.
- The forwarding route is not a mock; it forwards the same request to the live Fastify backend on `127.0.0.1:4317`.
- The Friction Gauge reads the selected card's `risk_class`, falling back to `risk_extraction_flag`; the selected LOW card illuminated the teal 2-block state.
