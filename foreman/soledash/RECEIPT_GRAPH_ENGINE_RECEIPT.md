# RECEIPT_GRAPH_ENGINE_RECEIPT

Status: COMPLETE

Built:
- Receipt relationship model with parent receipt, child receipt, originating card, originating policy, originating dispatch, and follow-up receipt links.
- Receipt graph scanner for known SoleDash receipt stores:
  - `foreman/soledash/ACTION_RECEIPTS.jsonl`
  - `foreman/soledash/PETRA_TRANSPORT_RECEIPTS.jsonl`
  - every `foreman/soledash/**/receipts/*.json` store
- Alias resolution for receipt IDs and receipt file paths.
- Backend lookup API only. No UI, no clickable graph, no visualizer.

Exposed:
- Graph lookup: `GET /api/soledash/v1/receipt-graph?receipt_id=<id>&mode=graph`
- Chain lookup: `GET /api/soledash/v1/receipt-graph?receipt_id=<id>&mode=chain`
- Dependency lookup: `GET /api/soledash/v1/receipt-graph?receipt_id=<id>&mode=dependencies`
- Index summary: `GET /api/soledash/v1/receipt-graph`

Files:
- `lib/soledash/receipt-graph/types.ts`
- `lib/soledash/receipt-graph/engine.ts`
- `app/api/soledash/v1/receipt-graph/route.ts`

Verification:
- `npm.cmd run typecheck` passed.
- Index endpoint returned `receipt_count=47`, `origin_count=17`, `edge_count=19`.
- Chain lookup for `mwb_local_restart_recovery` returned the approval-swatter receipt and originating policy `codex_mwb_local_restart_recovery`.
- Dependency lookup for `mwb_local_restart_recovery` returned policy dependency and no blocker.
- Chain lookup for `auto_ui_cleanup_across_screens_1781551521436_unmtn` returned a 2-receipt follow-up chain tied to originating card `ui_cleanup_across_screens`.

Acceptance:
- Given a receipt ID, the system can return the complete known receipt chain from indexed local receipt stores.

Blocker:
- None.
