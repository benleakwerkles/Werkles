# Heimerdinker BVPGM — Multi-Location Opportunity Network M2

Date: 2026-09-01  
Execution context: `CODEX_LOCAL` / Betsy / canonical Werkles repository  
Status: `BUILT_AND_LOCALLY_PROVED__BEAN_PACKET_REVIEW_ASSIMILATED__LJ_EXPERIENCE_SEAL_PENDING`

## Operator correction

Decatur was an example city, not Ben's location and not a product default. A Werkle can include people in different cities. Werkles must keep those contexts distinct instead of borrowing one person's city for everybody.

## Built

- Multi-location planner with participant-local, project-local, mutually chosen meeting-area, and statewide/remote lanes.
- Private participant locations are removed before lane planning.
- Missing meeting-area choice produces no query; Werkles does not call a geometric midpoint convenient.
- Participant travel radius remains structured data and is not placed in vendor query text.
- `POST /api/opportunities/plan` returns planned lanes without contacting an outside provider.
- Atlanta/Columbus rendered walkthrough with official Invest Atlanta and UGA SBDC source doors.
- Decatur remains visibly labeled as a lower-page source-audit fixture.
- Workshop, Personal Bellows, and Werkle doors now say `See the location-aware example`, not `Walk the Decatur example`.
- Bean's earlier packet-level trust review was harvested and assimilated into a visible `not verified by Werkles` card boundary.
- Bean's multi-location `CONDITIONAL GO` was harvested and its source/date and location-sharing corrections were assimilated.
- Hero route-label contrast was corrected after rendered inspection.

## Verification

- `npx --yes tsx scripts/foreman/multi-location-opportunity-smoke.ts` — PASS
- `npx --yes tsx scripts/foreman/multi-location-opportunity-api-smoke.ts` — PASS
- `npx --yes tsx scripts/foreman/business-opportunity-contract-smoke.ts` — PASS
- `npm run typecheck` — PASS
- live local `POST /api/opportunities/plan` — HTTP 200, four lanes, `liveSearchStarted: false`
- `/draft-reviews/business-opportunities` — HTTP 200
- rendered browser inspection — Atlanta and Columbus remain separate; missing meeting area stops; practice-data notice visible; contrast repaired

## Actual CBCC rotation

| Seat | Packet | Dispatch | Terminal response | Receipt status |
|---|---|---|---|---|
| Bean | `TO_BEAN_REAL_BUSINESS_OPPORTUNITY_LAYER_20260901` | existing exact task | returned and harvested | valid packet-level trust review; assimilated |
| Bean | `TO_BEAN_MULTI_LOCATION_OPPORTUNITY_TRUST_ATTACK_20260901` | exact existing DeepSeek task | returned and harvested | valid packet-level trust review; conditional go; assimilated; not a code/live-walk seal |
| Lady Jessica | `TO_LADY_JESSICA_MULTI_LOCATION_OPPORTUNITY_EXPERIENCE_SEAL_20260901` | repo outbox written; Cursor app and canonical workspace observed open, but no proven exact-task notification route | none | not dispatched; not a receipt |

No substitute chat, subagent, persona, environment, push, deploy, provider activation, credentials, schema/RLS, production-data mutation, or spend.
