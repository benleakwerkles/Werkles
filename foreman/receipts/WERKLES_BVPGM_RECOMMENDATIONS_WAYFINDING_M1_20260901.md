# Werkles BVPGM — Recommendations Wayfinding M1

Date: 2026-09-01
Execution context: `CODEX_LOCAL`
Branch: `maker/site-g-20260703`
Starting HEAD: `866c458`

## Pull

- `TO_LADY_JESSICA_RECOMMENDATIONS_FLOW_WALK_20260901.md`: packet exists in outbox; no proved dispatch and no matching terminal return.
- `TO_ENDER_RECOMMENDATIONS_FLOW_WALK_20260901.md`: packet exists in outbox; no proved dispatch and no matching terminal return.
- Re-pull after both Momentum ideas: `NO_MATCHING_LJ_OR_ENDER_RETURN`.
- No packet creation, delivery, visible provider state, or browser/UI attempt is called a receipt.

## Broad checkpoint

Keep Recommendations as the clear center while making its legitimate continuations visible, then verify the adjacent Intake and Match Deck pages preserve function-first placement and member orientation.

## G / M idea 1 — honest route-line destination

- Changed the Recommendations member-header continuation from the false single-path declaration `Next: My Work` to the in-page `Next: See My Results`.
- Added the stable `#recommendation-results` target to the recommendation deck.
- Updated the focused navigation contract.

## G / M idea 2 — stop burying Workshop and Bellows

- Moved the Workshop continuation from below the complete recommendation work-product apparatus to immediately below the selected result and people gateway.
- Added `Open My Bellows` beside `Open My Workshop` so the page exposes learning and building as legitimate continuations without turning the hero into a directory.
- Kept tools, locations, suppliers, and the public library in the existing collapsed practical-resources section.
- Corrected the stale Workshop ordering assertion to the current `workshop-room` structure.

## Rendered evidence

Recommendations after patch:

- results begin near 567px;
- people gateway begins near 1,263px;
- Workshop / My Bellows continuation begins near 1,613px instead of about 4,343px;
- practical resources remain collapsed near the bottom;
- member route line resolves to `#recommendation-results`;
- browser console warnings/errors: none.

Adjacent flow:

- Intake form begins near 773px; Bellows room and member header present.
- Match Deck candidates begin near 711px; People room and member header present.
- browser console warnings/errors: none.

## Verification

- `node scripts/foreman/squibb-recommendation-navigation-smoke.mjs`: PASS
- `node scripts/foreman/walkthrough-function-first-copy-smoke.mjs`: PASS
- `npm run typecheck`: PASS
- focused `git diff --check`: PASS (line-ending warnings only)

## Hard edges preserved

- No subagents or replacement CBCC tasks created.
- No provider credentials, schema, production data, push, or deploy actions.
- Existing unrelated dirty-tree work was not staged, discarded, or rewritten.
- No LJ or Ender participation claimed without a personal terminal response.
