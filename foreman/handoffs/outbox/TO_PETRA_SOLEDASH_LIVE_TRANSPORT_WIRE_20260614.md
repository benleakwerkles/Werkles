# TO: Petra / Comptroller
# FROM: Maker @ Betsy
# RE: MISSION — Wire SoleDash UI To Live Transport Files
# DATE: 2026-06-14

## Built

SoleDash now reads Dink-owned transport files server-side. React does not generate ranking, owner routing, action statuses, or receipt entries.

### Read paths

| Source | Fields / purpose |
|--------|------------------|
| `foreman/soledash/DECISION_SURFACE.json` | `live_transport`, `mock`, `frontier`, `machine_frontier`, `top_3_alternatives`, `queue_items`, `active_owner`, `current_blocker`, `updated_at` + render slots |
| `foreman/soledash/receipts/*.json` | Receipt Center (sorted by `updated_at` desc) |
| `foreman/soledash/actions/*.json` | Action Rail — latest by `updated_at` |

### Rules implemented

1. `mock: false` + `live_transport: true` → **LIVE** badges; no mock-only queue payload
2. `simulated: true` on receipt/action files → **SIMULATED** badge (still file-backed)
3. No ranking/alternatives computed in React — Dink arrays rendered as-is
4. Load failure → **LIVE PAYLOAD UNAVAILABLE** banner + blocker
5. Missing `DECISION_SURFACE.json` → falls back to Maker mock (dev only)

### Verified state (seed files on Betsy)

- Frontier: **P0-A001 Workstation Uniformization** · rank_source: **operator**
- Machine Frontier: **P0-A002 Doss Stability Investigation**
- Top 3 alternatives: **P0-A002**, **P0-A003**, **P0-A007**
- Current Blocker: **blocker_maker_live_file_integration_v0_1**
- Receipt Center: 2 file-backed rows (SIMULATED)
- Action Rail: latest `act_live_yea_001` resolved (SIMULATED)

## Preview

http://localhost:3000/soledash

Hard-refresh. Header shows **LIVE** badge.

## Files changed

- `protocol/index.ts` — live transport + file record types
- `lib/soledash/decision-surface/load-live-transport.ts` (new)
- `lib/soledash/decision-surface/load-contract.ts`
- `components/soledash/decision-surface.tsx` — removed UI-local receipt/queue/lifecycle state
- `components/soledash/decision-surface-panels.tsx` — direct frontier/alternatives render
- `app/soledash/soledash.css` — LIVE/SIMULATED/unavailable styles
- `foreman/soledash/.gitignore` — receipts/, actions/

Runtime (gitignored, Dink-owned):

- `foreman/soledash/DECISION_SURFACE.json`
- `foreman/soledash/receipts/*.json`
- `foreman/soledash/actions/*.json`

## What is now live

- Decision surface queue/frontier/blocker from Dink JSON
- Receipt Center from `receipts/` directory
- Action Rail from `actions/` directory (latest file)
- Poll refresh reloads file state (20s + manual Refresh)

## What remains simulated

- Receipt/action files marked `simulated: true` (test dispatch, not cousin transport)
- Button POST handlers still mock until Dink wires write-back on click
- Queue override POST still mock API — refresh expects Dink file updates
- Chat / Petra transport unchanged

## Success

Ben sees Dink-owned file state: frontier, machine frontier, alternatives, blocker, receipts, and action rail — with honest LIVE vs SIMULATED labels.
