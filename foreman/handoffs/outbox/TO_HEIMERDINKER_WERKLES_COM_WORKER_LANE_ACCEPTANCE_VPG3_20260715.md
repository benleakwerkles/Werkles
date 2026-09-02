# TO HEIMERDINKER — Werkles.com Worker Lane Acceptance

Packet: `TO_HEIMERDINKER_WERKLES_COM_WORKER_LANE_ACCEPTANCE_VPG3_20260715`  
Seat: `Dink@Betsy` / Heimerdinker  
Execution authority: Ben (Operator)  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Lane: Werkles.com only

## Current state

- Werkles publicly presents six lanes, including `Worker`.
- The beta API maintains a separate, hand-written five-lane normalization map.
- `Worker` is therefore not recognized by the endpoint even when the visible lane list is corrected.

## Strongest idea

Make the beta endpoint derive accepted lane names from the canonical `copy.laneOptions` list instead of maintaining a second list. Preserve case-insensitive acceptance and the current `null` behavior for unknown lanes.

This closes the current `Worker` mismatch and prevents the visible list and endpoint from drifting apart again.

## Allowed files

- `app/api/beta/route.ts`
- this packet and its receipt

## Proof

- the endpoint derives its lane map from `copy.laneOptions`
- exact and lowercase `Worker` inputs normalize to `Worker`
- unknown lanes still normalize to `null`
- invalid-email requests still fail with HTTP `400` before database access
- TypeScript passes

## Forbidden

No valid beta submission, database/schema work, Supabase configuration, new endpoint, dependency, deploy, push, merge, secret, feature-flag change, Harvey/ThinkIt work, or remote-machine action.

## Stop

Stop after local proof and receipt. Ben owns later commit, push, deploy, or public promotion.
