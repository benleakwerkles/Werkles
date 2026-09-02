# Workshop route sequence executable contract

Date: 2026-08-15  
Lane: local Ghost Fleet walkthrough / owner surfaces  
Status: focused readback and executable offline contract; no release authority  
Execution context: `LOCAL_SALLY_WINDOWS` on Betsy  

This is an unnamed local-worker review. It does not stand in for a named CBCC seat.

## Contract proposed

The current local sequence is:

`/bellows/intake` → `/bellows/recommendations` → `/dashboard/blueprints` (Workshop) → `/dashboard/intros`

The recommendations page is not a second Workshop. It is the interpretation seam: it explains the intake-derived options and, only when its synthetic result is bound to the exact intake being displayed, offers the next two local walkthrough surfaces. Workshop comes first in the reading and action order; Intros remains available as the current synthetic candidate readout.

Exact point-in-time continuity is deliberately **not** claimed. Workshop and Intros reload the owner’s current latest intake. A later intake submission can therefore change their state after the recommendations page was rendered. The current CTA language says “current” rather than promising that the displayed count or intake version will be carried across routes. Signed owner-and-intake version handoff remains separate architecture work.

## Executable assertions

The focused smoke checks four boundaries.

### 1. Correct sequence

- Intake posts to `/api/bellows/intake` with same-origin credentials.
- A failed save cannot advance; successful save precedes navigation to `/bellows/recommendations`.
- Recommendations reads the browser owner, ranks only for that owner, and requires the match intake ID to equal the recommendation intake ID.
- The page presents Workshop before Intros and retains the “ranking is not verification or an introduction” boundary.
- Workshop reads the browser owner and offers the next Intros route.

### 2. Honest empty Workshop

- Missing owner or missing owner-scoped intake returns `emptyOwnerSurfaceState()`.
- Empty state has no intake ID, no carrying rows, no candidate availability, and zero candidate/review counts.
- Copy says Werkles will not guess and nothing is filled in.
- The recovery action is the concierge intake.
- Intake-derived summary, carrying, and coverage sections remain gated by `hasIntake`.

### 3. Honest populated Workshop

- `hasIntake: true` is constructed only after `readLatestSpeakerIntakeForOwner(ownerId)` returns an intake.
- Carrying rows use the saved intake answers and mark unanswered rows from actual blank values.
- Candidate availability follows the Ghost Fleet environment gate.
- Candidate counts come from the actual rules-only ranking, not filler.
- Populated candidate language says synthetic and the fixed Ghost Fleet disclosure remains present.

### 4. Honest Intros continuation

- Intros re-reads the browser owner; it does not accept an owner from the URL.
- Missing owner/intake produces no ask, reasons, doors, or synthetic disclosure.
- Populated doors remain `synthetic: true`, show “synthetic test member,” and receive the fixed disclosure only when doors exist.

Run:

```powershell
node scripts/foreman/workshop-route-sequence-smoke.mjs
```

## Relationship to existing proof

This contract complements rather than replaces:

- `scripts/foreman/member-walkthrough-route-inventory-smoke.mjs` — route existence and navigation dead-zone inventory;
- `scripts/foreman/ghost-fleet-playable-loop-smoke.ts` — exact intake bridge, 150/150 synthetic fleet, and raw candidate-leak boundary;
- `scripts/foreman/ghost-fleet-handeye-attack.mjs` — live local multi-owner/runtime attack when an explicitly configured walkthrough server is being exercised;
- `foreman/handoffs/outbox/CBCC_GHOST_FLEET_WALKTHROUGH_MISSION_20260802.md` — locked product order;
- `foreman/handoffs/outbox/CODEX_MEMBER_WALKTHROUGH_ROUTE_ATTACK_20260814.md` — auth-boundary and route review findings.

## Limits

This is a source-level offline contract. It does not claim browser rendering, cookie persistence across a real navigation, CSS quality, route-level authentication completeness, exact cross-route intake-version continuity, or CBCC review. The existing missing-auth-guard findings for Workshop and Intros remain open. No app/UI, SQL, provider, environment, schema, git staging, commit, push, deploy, or production change occurred.
