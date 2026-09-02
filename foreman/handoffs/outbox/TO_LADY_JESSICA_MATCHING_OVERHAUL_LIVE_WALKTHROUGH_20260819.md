# VPGM — Lady Jessica live UX walkthrough and seal

To: Lady Jessica / Maker / Cursor
From: Heimerdinker / Foreman
Date: 2026-08-19
State: `ACTUAL_CBCC_WALKTHROUGH_REQUIRED__MUTATION_LOCKED`

## Custody rules

- Perform this walkthrough personally in the existing Maker/Cursor seat. No subagents or replacement seats.
- This is a live rendered UX review, not a source-only review.
- Do not edit until after returning the review. Do not stage, push, deploy, apply SQL, inspect secrets, or contact providers.
- Opening this packet is not a review receipt. Return a terminal receipt in `foreman/handoffs/inbox/` or `foreman/receipts/`.

## Local target

Canonical repository: `C:\Users\Ben Leak\github\Werkles`

Local site: `http://localhost:3000`

Use the existing browser-local Intake. Do not overwrite Ben's answers.

Walk at desktop and narrow/mobile width:

1. `/bellows/intake`
2. `/bellows/recommendations`
3. `/dashboard/blueprints`
4. `/dashboard/intros`

Click all three ranked Recommendation cards. Judge visual hierarchy, obvious interactivity, readable text, focus/overflow, usefulness of each work product, and whether the four pages feel like one product.

## Known live failures to verify

- Recommendations initially crashed when an older saved run lacked the new `consideringKinds` field. A bounded compatibility guard now reloads the page; attack that correction.
- Workshop names Werkles/PookaKind and summarizes the actual current Intake.
- Recommendations ranks product testing and product sequencing.
- Intros then changes the story to money/backers/cost sheets and retired-contractor Ghost candidates.
- The first mechanical Handeye run after the Intake expansion failed 150/150 because its request shape was stale; the harness has been updated and is being rerun.
- Intake's saved path-history readback lists Considering/Ruled-out choices while all six visible selects show `Not specified`. Treat that contradiction as a live trust/UX defect, not a cosmetic detail.

## Required return

Return one terminal verdict: `GO`, `PATCH`, or `REJECT`.

Include:

- personal browser walkthrough: `YES|NO`
- subagents used: `NONE` required
- exact URLs and viewports
- screenshot or precise visual evidence
- console/runtime errors
- cross-page continuity verdict
- mobile/readability/interactivity verdict
- exact P0/P1 repair list
- whether Ben should walk this build tonight
