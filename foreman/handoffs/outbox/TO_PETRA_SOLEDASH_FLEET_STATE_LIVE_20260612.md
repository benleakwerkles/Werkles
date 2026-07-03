# TO: Petra / Comptroller
# FROM: Maker @ Betsy
# RE: MISSION — Replace Mock Fleet Slots With Live FLEET_STATE
# DATE: 2026-06-12

## Built

Fleet row now reads **Dink-owned FLEET_STATE.json** instead of hardcoded MOCK peer cards.

### Loader paths (in order)

1. `foreman/soledash/FLEET_STATE.json` (repo-local transport on Betsy)
2. `C:\Users\Ben Leak\Documents\Codex\2026-06-15\to-dink-on-doss-from-petra\foreman\soledash\FLEET_STATE.json` (Dink handoff path)

If neither file exists → peers render **UNKNOWN** literally (not MOCK).

### Each machine card shows

- display_name + hostname
- **status** (main badge — literal from FLEET_STATE)
- **evidence_status** (confidence badge — literal)
- active_cousins · current_task
- remote_path_status · workstation_uniformity_status · needs_operator_touch
- **latest_receipt_path** when present, else **blocker**
- Betsy keeps **You are here**

### Fleet feed indicator

- **FLEET_STATE live** when file loads
- **FLEET_STATE UNKNOWN** when file missing

### Ambient silhouettes

Dot color maps from status (LIVE / PARTIAL / MOCK only if FLEET_STATE says MOCK / UNKNOWN gray).

## Preview

http://localhost:3000/soledash → Open Command → Machine Fleet

## Files changed

- `protocol/index.ts` — FleetStateFile, FleetStateMachineEntry, extended FleetMachineCard
- `lib/soledash/megawork-home/load-fleet-state.ts` (new)
- `lib/soledash/megawork-home/fleet-cards.ts` (new, server-only)
- `lib/soledash/megawork-home/fleet-utils.ts` — map FLEET_STATE → cards, Betsy patch
- `lib/soledash/megawork-home/build-view.ts` — uses buildFleetCards
- `components/soledash/megawork-home-panels.tsx` — FleetRow with status/evidence badges
- `components/soledash/decision-surface.tsx` — FleetRow in command layer + refresh
- `components/soledash/ambient-command-layers.tsx` — UNKNOWN dot
- `app/api/soledash/v1/state/route.ts` — homeFleet on refresh
- `app/soledash/soledash.css` — fleet badge styles
- `foreman/soledash/FLEET_STATE.json.example` (new)
- `foreman/soledash/FLEET_STATE.json` (seeded locally for Sally transport)

## What became live

- **Doss** — PARTIAL LIVE / HYPOTHESIS from FLEET_STATE (not MOCK badge)
- **Sally** — LIVE / OBSERVED from FLEET_STATE
- **Spanzee** — UNKNOWN status/evidence shown literally (honest uncertainty)
- **Betsy** — merged FLEET_STATE + live DECISION_SURFACE receipts; **You are here**

## What remains unknown

- Dink handoff path **not present on Sally** at build time (`2026-06-15` Codex folder missing)
- Spanzee hostname, remote_path, workstation_uniformity (UNKNOWN in feed)
- Sally receipt path (blocker shown — no latest_receipt_path)
- Real Doss hostname (placeholder `DOSS_HOSTNAME` until Dink updates feed)
- Cousin auto-dispatch / cross-machine receipt transport

## Operator action

When Dink publishes live feed to Doss handoff path, copy or sync to either loader path above — fleet refreshes on SoleDash poll/refresh. No code change required.

## Success

Fleet row no longer lies. Peers are MOCK only if FLEET_STATE status says MOCK. UNKNOWN stays visible.
