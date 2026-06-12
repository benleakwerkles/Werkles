# FROM_MAKER_SOLEDASH_INBOX_OUTBOX_BUILD_V1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Scope: read-only, file-derived V1. No send buttons, no routing, no automation, no Speaker, no production, no deploy.

## What was built

Implemented the smallest path from the SoleDash plan: **Inbox / Outbox / Receipts** in the existing console (`scripts/foreman/foreman-control-server.mjs`, http://127.0.0.1:4317), read-only and file-derived. Existing GD Status Layer behavior is unchanged.

## Files changed

- `scripts/foreman/foreman-control-server.mjs`
  - Added `fs`/`path`/`url` imports + `REPO_ROOT`, `OUTBOX_DIR`, `INBOX_DIR`.
  - `readPacketDir()` loader → lists `.md`/`.txt` files in `foreman/handoffs/{outbox,inbox}` (metadata only; **bodies never read**).
  - `getOutbox()`, `getInbox()`, `getReceipts()` (receipts derived from state).
  - `soledashHtml()` SoleDash section (Inbox / Outbox / Receipts, newest first, state chips) + CSS.
  - Injected SoleDash section into the page after the GD Status Layer.
  - Read-only endpoints: `GET /outbox`, `GET /inbox`, `GET /receipts`.
- `foreman/control-panel/README.md` — SoleDash section, endpoints, and naming note (SoleDash = UI label; GD/GimpDash = legacy/internal).
- `foreman/handoffs/outbox/FROM_MAKER_SOLEDASH_INBOX_OUTBOX_BUILD_V1.md` — this report.

## Endpoint behavior

- `GET /` — console HTML: GD Status Layer + SoleDash (Inbox/Outbox/Receipts) + Human Gates Console.
- `GET /outbox` — `{ ok, items[] }` from `handoffs/outbox/`, newest first; each `{ id, actor, subject, time, state, sourcePath }`. Default state `Received`.
- `GET /inbox` — same shape from `handoffs/inbox/`. Default state `Response Incoming`.
- `GET /receipts` — `{ ok, items[] }`; each `{ packetId, destination, status, lastUpdate }`. Status derived: Complete→Delivered, Failed→Failed, else Awaiting.
- `GET /status`, `GET /health` — unchanged.

## Local verification (in-container smoke test)

- `node -c` syntax: OK.
- `GET /` → 200; HTML contains both **GD Status Layer** and **SoleDash** with Inbox/Outbox/Receipts.
- `GET /outbox` → lists real files from `foreman/handoffs/outbox/` (newest first), e.g. `FROM_MAKER_GD_STATUS_LAYER_V1.md`.
- `GET /inbox` → lists `FROM_CURSOR_READ_ME.md` with state `Response Incoming`.
- `GET /receipts` → derived buckets (all `Awaiting` in V1).
- **Body-leak check:** searched rendered HTML for packet body text (`EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER`, which exists inside packet files) → **0 matches**. Confirms metadata-only rendering; no bodies, no secrets.
- Server started briefly to verify, then stopped.

## Preview notes

No screenshot tooling in this container. Layout: SoleDash renders as a 3-column board (Inbox · Outbox · Receipts) using the same dark-copper theme and state chips as the GD Status Layer; rows show actor · subject(filename) · timestamp · state chip; Receipts shows Delivered/Failed/Awaiting buckets with counts. To view: run the server locally and open http://127.0.0.1:4317.

## Risks

- **States are V1 defaults, not live** — labeled in UI; could mislead if mistaken for a real feed.
- **Filename-derived actor** (`TO_X` / `FROM_X`) — files not following the convention show `—`.
- **Folder coupling** — UI depends on `foreman/handoffs/{outbox,inbox}` conventions.
- **No completion tracking yet** — all receipts are `Awaiting` until a real state source exists.
- Mitigated: bodies never read (no secret leakage); read-only (no writes/sends/routing).

## Rollback path

- Revert the build commit on this branch, or simply don't merge the PR.
- The SoleDash feature is additive and isolated to `foreman-control-server.mjs` + docs; removing the `soledashHtml()` call and the three endpoints fully disables it with no other impact.
- Nothing outside the console is touched; no app/product/runtime/state changes to roll back.

## Stacking

Built on the GD Status Layer branch (PR #9), which is on the Human Gates Console branch (PR #5). Merge order: PR #5 → PR #9 → this. Nothing merged here.
