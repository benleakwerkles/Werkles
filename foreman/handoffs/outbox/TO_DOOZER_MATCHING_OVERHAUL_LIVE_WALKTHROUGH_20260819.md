# VPGM — Matching overhaul live walkthrough

To: Doozer / Orson
From: Heimerdinker / Foreman
Date: 2026-08-19
State: `ACTUAL_CBCC_WALKTHROUGH_REQUIRED__MUTATION_LOCKED`

## Custody rules

- Perform this review personally. No subagents or replacement seats.
- This is a live browser walkthrough, not a source-only review.
- Do not edit, commit, stage, push, deploy, apply SQL, inspect secrets, or contact providers.
- An outgoing packet is not a completed review. Return a terminal receipt.

## Local target

Canonical repository: `C:\Users\Ben Leak\github\Werkles`

Local site: `http://localhost:3000`

Use the browser state already containing Ben's current local Intake. Do not overwrite his answers.

Walk this sequence at desktop and narrow/mobile width:

1. `/bellows/intake`
2. `/bellows/recommendations`
3. `/dashboard/blueprints`
4. `/dashboard/intros`

Exercise the first three ranked Recommendation cards. Inspect the selected readout, working artifact, causal explanation, console, focus, overflow, and cross-page story.

## Known evidence to attack, not assume fixed

1. First live load of Recommendations crashed on an older saved run:
   `TypeError: Cannot read properties of undefined (reading 'includes')` at `hasDirectIntent` in `lib/matching/opportunity-case.ts`.
2. A bounded compatibility guard and regression were added locally; reload then rendered.
3. Workshop reads Ben's current project as Werkles and PookaKind.
4. Recommendations now ranks product-testing/product-sequencing work.
5. Intros breaks continuity and returns to a capital/backer/cost-sheet narrative with retired-contractor Ghost candidates.
6. The first Handeye run after the Intake expansion failed 150/150 because the harness omitted the now-required `business_stage`; the harness has been updated and must be rerun.
7. Intake visibly contradicts itself on reload: the working brief lists Considering/Ruled-out history, while every corresponding select control displays `Not specified`. Attack whether a resubmit preserves, erases, or misstates path history.

## Questions

- Does one saved Intake drive one coherent causal story across all four pages?
- Does each ranked option produce meaningfully different, useful work?
- Are historical/ruled-out paths prevented from becoming current intent?
- Do the visible path-status controls agree with the working brief and saved data?
- Are thin or contradictory answers held back rather than laundered into confident advice?
- Does the page remain readable, operable, and obvious at mobile width?
- Is this good enough for Ben to walk and critique without being burned by stale state or a fake-ready page?

## Required return

Return one terminal verdict: `GO`, `PATCH`, or `REJECT`.

Include:

- personal browser walkthrough: `YES|NO`
- subagents used: `NONE` required
- exact URLs visited
- desktop/mobile viewport evidence
- console/runtime errors
- cross-page continuity verdict
- ranked-option differentiation verdict
- P0/P1 findings with exact page/component anchors
- whether the current build is safe for Ben's walkthrough
