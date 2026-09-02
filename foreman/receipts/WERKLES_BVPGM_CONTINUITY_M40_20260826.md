# Werkles BVPGM continuity — M40 receipt

PROJECT_ID: WERKLES  
WORK_ID: MEMBER_JOURNEY_CONTINUITY  
CYCLE_ID: M40_20260826  
SEAM_ID: INTAKE_BALANCE__RECOMMENDATION_HISTORY__MATCH_PREVIEW

## Broad result

1. **Intake no longer clings to the left edge.** The complete 1,024px working surface now centers itself inside the wide page with equal 208px gutters at a 1,440px viewport. Every field, selected answer, maximum length, recovery control, working brief, and submission path remains unchanged.
2. **Recommendations keeps history without forcing history into the journey.** Five saved Intake records now appear as one closed `5 recent Intakes` account-history summary after the Workshop handoff. Opening it reveals every record and the unchanged distinction between account-saved Intake history and device-local recommendation drafts.
3. **Match Deck stopped reserving a blank assignment panel.** The closed private-profile preview is 73px on desktop and 94px on phone. Opening it exposes all four limited-profile fields, the correction action, and the explicit exclusions for balances, net worth, precise location, drafts, behavioral tracking, inferred traits, and other Werkles.

## Verification

- `npm run typecheck`: PASS
- Member Intake account custody contract: PASS
- Stable member header / Match Deck contract: PASS
- Ghost shortlist diversity contract: PASS
- Match Deck conversation diversity rendered smoke: PASS — distinct profiles and four-answer sets
- Desktop Intake balance: PASS — 1,024px surface, 208px equal gutters, no horizontal overflow
- Desktop Recommendations history: PASS — 85px closed, 5 retained records, custody statement retained
- Desktop Match Deck preview: PASS — 73px closed; 716px open; 4/4 fields visible
- 390px Intake, Recommendations, and Match Deck: PASS — no horizontal overflow
- Browser console errors: none observed
- Targeted whitespace check: PASS (line-ending warnings only)

## Existing stale sentinels

- `intake-recommendations-handoff-smoke.ts` still expects the previously removed phrase `Intake received`.
- `pithy-recommendations-custody-smoke.ts` still expects the previously removed phrase `Your Pooka has some ideas`.
- Direct `node` execution of `ghost-shortlist-diversity-smoke.ts` cannot resolve the repo `@/` alias; the same contract passes through `tsx`.
- These reds predate and do not exercise the M40 changes. Product copy was not regressed to satisfy obsolete assertions.

## Evidence

- `foreman/receipts/browser-capture/m40-intake-before.png`
- `foreman/receipts/browser-capture/m40-intake-after-desktop.png`
- `foreman/receipts/browser-capture/m40-intake-after-mobile.png`
- `foreman/receipts/browser-capture/m40-recommendations-before.png`
- `foreman/receipts/browser-capture/m40-recommendations-after-desktop.png`
- `foreman/receipts/browser-capture/m40-recommendations-after-mobile.png`
- `foreman/receipts/browser-capture/m40-match-deck-before.png`
- `foreman/receipts/browser-capture/m40-match-deck-after-desktop.png`
- `foreman/receipts/browser-capture/m40-match-deck-after-mobile.png`

## CBCC rotation state

- Ender M40 UX packet authored before construction; established background route absent; `COMPOSED_NOT_SENT`; no review credited.
- Bean M40 trust packet authored before construction; established background route absent; `COMPOSED_NOT_SENT`; no review credited.
- Lady Jessica M40 visual packet authored before construction; established background route absent; `COMPOSED_NOT_SENT`; no review credited.
- M pull repeated after construction: no listeners on the established background relay ports and no fresh M40 inbox receipt.
- Candidate remains local and independently unaccepted. No Codex subagent, substitute environment, or foreground desktop control was used.

## Boundaries

No matching/ranking, account storage, auth, provider, credential, schema/RLS, production-data, spend, push, or deploy action. Existing dirty work remains preserved.

## Operator walk

Start `/bellows/intake` and confirm the form is centered. Continue to `/bellows/recommendations`; the Workshop handoff now leads into one compact account-history summary. Finish `/dashboard/intros`; the final private preview no longer creates a blank panel and still opens to the full limited-profile boundary.
