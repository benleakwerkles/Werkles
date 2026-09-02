# Werkles Matching overhaul — live walkthrough receipt

Date: 2026-08-19
Seat: Heimerdinker / Foreman
Context: CODEX_LOCAL on Betsy / canonical dirty shared tree
State: `WALKTHROUGH_REJECT__TEAM_RETURNS_PENDING`

## Personal execution

- Browser walkthrough performed personally: YES
- Codex subagents used: NONE
- New environments created: NONE
- Ben transport required: NO
- Provider calls / secrets / SQL / push / deploy: NONE

## Routes walked

1. `/bellows/intake`
2. `/bellows/recommendations`
3. `/dashboard/blueprints`
4. `/dashboard/intros`
5. `/dashboard/crucible`
6. `/login?next=%2Fbellows%2Frecommendations`

The first three ranked Recommendation cards were exercised. The synthetic Stripe Identity and Twilio practice paths were completed without provider calls. The local `gimprobotester` return path was clicked and returned to the current saved Recommendations state.

## Runtime findings

### P0 — legacy saved Intake crashed Recommendations

First load rendered the app error boundary:

`TypeError: Cannot read properties of undefined (reading 'includes')`

Anchor: `lib/matching/opportunity-case.ts`, `hasDirectIntent`.

Cause: a saved pre-repair `ShadowMatchingRun` did not contain the new `consideringKinds` array.

Bounded correction: treat a missing legacy array as no explicit current intent; added a hostile legacy-run regression. Reload then rendered the current Intake.

### P0 — the four-page story is not causally joined

- Intake/Workshop correctly identify the project as Werkles and PookaKind.
- Recommendations ranks product testing and product sequencing.
- Intros discards that decision context and returns to a capital/backer/cost-sheet narrative with retired-contractor Ghost candidates.

The pages load, but they do not yet behave like one reasoning system.

### P1 — saved path history contradicts its controls

The Intake working brief shows Considering/Ruled-out path history. All six visible path-status selects display `Not specified` on the same render. The parser only accepts one exact status line at a time, so older saved formatting can remain visible in the brief while the controls fail to reconstruct it.

### P1 — first mobile screen is mostly chrome

At the connected narrow viewport (320 CSS px wide, 493 px high), the persistent site header, primary navigation, and two page links consume the first screen before the Intake form. No runtime error occurred, but the first useful question begins below the fold.

### P1 — login copy/state remains internally inconsistent

The local return path works and preserves the current browser Intake, but the page still says `Your compact way back into Werkles`, language Ben already rejected. It also presents only a local `Continue as gimprobotester` action while surrounding copy promises saved work, messages, and updates as if account persistence existed.

### P1 — Crucible is operable but materially overlong

The provider-readiness story and both ghost practice flows work without console errors. The page repeats readiness, proof boundaries, workflow states, planned providers, and twelve checks in one very long surface. This passes mechanics but not the requested pithy product standard.

## Mechanical Handeye

Initial run after the nine-field Intake change:

- PASS: 0
- FAIL: 150
- cause: stale harness omitted required `business_stage`
- receipt: `foreman/receipts/WERKLES_GHOST_FLEET_HANDEYE_REDTEAM_2026-08-19T04-30-00-002Z.json`

The harness was updated to submit the current required field and owner-specific resource/constraint context.

Focused proof: 1/1 PASS.

Full rerun:

- PASS: 150
- FAIL: 0
- distinct top scores: 15
- receipt: `foreman/receipts/WERKLES_GHOST_FLEET_HANDEYE_REDTEAM_2026-08-19T04-35-36-267Z.json`

This proves mechanical route/coherence assertions only. It does not overrule the live cross-page UX rejection above.

## Local code proofs

- `matching-intent-boundary-smoke.ts`: PASS
- `matching-opportunity-case-smoke.ts`: PASS
- TypeScript: PASS
- scoped `git diff --check`: PASS, expected Windows line-ending warnings only

## Actual CBCC status

- Doozer / Orson: returned `ROUTE_BLOCKER: BETSY_LOCALHOST_UNREACHABLE_FROM_ORSON_TASK`; `PERSONAL_BROWSER_WALKTHROUGH: NO`; `SUBAGENTS: NONE`; source review was not substituted. This is an honest routing receipt, not a walkthrough or approval.
- Lady Jessica / Maker: exact `TO_MAKER_MATCHING_*` packet and target packet opened in the existing Cursor surface; no independent execution receipt yet.
- Outgoing requests and packet custody do not count as completed reviews.

## Terminal Foreman ruling

`REJECT_FOR_OPERATOR_WALKTHROUGH`

Reason: the saved-state crash is corrected locally and mechanical Handeye is green, but Intake path-state reconstruction and Workshop → Recommendations → Intros causal continuity are not trustworthy yet. Doozer's task cannot reach Betsy localhost, and Lady Jessica has not returned an independent execution receipt. The walkthrough therefore remains rejected.
