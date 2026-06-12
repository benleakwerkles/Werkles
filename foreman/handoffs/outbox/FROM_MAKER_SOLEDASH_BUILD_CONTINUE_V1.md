# FROM_MAKER_SOLEDASH_BUILD_CONTINUE_V1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Scope: read-only continuation of SoleDash V1. No routing, no sending, no Speaker, no automation, no production, no deploy.
Naming: SoleDash = visible UI name · GD = legacy/internal shorthand only · GimpDash = deprecated.

## What was added (continuation)

Addresses the main V1 limitation (states were all defaults) and adds at-a-glance counts — still read-only and file-derived.

1. **Optional status sidecar** — `foreman/handoffs/soledash-status.json` (read-only). Maps packet filename → state (one of the six). The server reads it (never writes) and overrides default states; receipts then reflect reality (Complete→Delivered, Failed→Failed, else Awaiting). Absent/invalid file → defaults.
2. **Summary strip** — SoleDash shows Outbox/Inbox totals, receipt buckets (Delivered/Failed/Awaiting), and outbox state counts (chips).
3. **`GET /summary`** — read-only JSON: `{ outboxTotal, inboxTotal, byState, receipts }`.

GD Status Layer ("Status Layer") and Human Gates Console unchanged.

## Files changed

- `scripts/foreman/foreman-control-server.mjs`
  - `STATUS_SIDECAR` path + `getStatusOverrides()` (read-only JSON parse, validates against the six states).
  - `readPacketDir()` applies overrides over defaults.
  - `getSummary()` + `summaryStripHtml()` + strip CSS.
  - `GET /summary` endpoint.
- `foreman/control-panel/README.md` — documents sidecar, summary strip, `/summary`.
- `foreman/handoffs/outbox/FROM_MAKER_SOLEDASH_BUILD_CONTINUE_V1.md` — this handoff.

## Endpoint behavior

- `GET /summary` → `{ ok, outboxTotal, inboxTotal, byState:{<state>:count}, receipts:{Delivered,Failed,Awaiting} }`.
- `GET /outbox` `/inbox` — now reflect sidecar state overrides when present.
- `GET /receipts` — derived from (possibly overridden) outbox state.
- `GET /status` `/health` — unchanged.

## Local verification (in-container)

- `node -c` syntax: OK (after fixing one nested-quote template error).
- `GET /` → 200; summary strip renders; SoleDash + Status Layer present.
- `GET /summary` (no sidecar): `outboxTotal 12, inboxTotal 1, all Received, receipts 12 Awaiting`.
- With a temp sidecar `{ "...GD_STATUS_LAYER_V1.md":"Complete", "CODEX_PASTE_BLOCK.txt":"Failed" }`:
  - `/summary` → `Complete 1, Failed 1, Received 10; receipts Delivered 1 / Failed 1 / Awaiting 10`.
  - `/receipts` → `1 Delivered, 1 Failed, 10 Awaiting`.
- Temp sidecar deleted after the test — **not committed** (only the `.mjs` + docs are in this change).
- Server started briefly to verify, then stopped.

## Risks

- Sidecar is hand-maintained → can drift from reality; it's optional and clearly defaulted when absent.
- Still no live feed; states reflect defaults or the sidecar only.
- Filename-keyed sidecar must match exact packet filenames.
- Mitigated: read-only (no writes), bodies never read, invalid sidecar safely ignored.

## Rollback path

- Revert this branch's commit, or don't merge.
- To disable just this increment: remove `getStatusOverrides()` usage, `getSummary()`/`summaryStripHtml()` call, and the `/summary` route. Isolated to `foreman-control-server.mjs` + docs.

## Stacking

Stacked on PR #11 (SoleDash build) → PR #9 (Status Layer) → PR #5 (Human Gates Console). Merge order: #5 → #9 → #11 → this.
