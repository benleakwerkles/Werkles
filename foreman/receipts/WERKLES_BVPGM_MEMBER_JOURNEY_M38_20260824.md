# Werkles BVPGM member journey — M38 receipt

PROJECT_ID: WERKLES  
WORK_ID: MEMBER_JOURNEY_CONSOLIDATION  
CYCLE_ID: M38_20260824  
SEAM_ID: PROFILE_PROGRESSIVE_EDITOR__FOUR_ROOM_NAV__WORK_TO_PEOPLE_TO_WERKLE

## Broad result

1. **Profile became progressive instead of punishing.** All existing fields and the same account-save handler remain, but the three editing stages are now native, keyboard-accessible disclosures. Facts open first; Work and Story wait closed until the member wants them. The 390px full-page capture fell from roughly 7,689px in M37 to roughly 4,057px without deleting fields.
2. **The member header now obeys the established destination rule.** The public `People` door stays public; the member row reads `My Work`, `Match Deck`, `Bellows`, `About Me`. `Match Deck` has one stable destination: `/dashboard/intros`.
3. **Workshop duplication was reduced.** `People for this work` remains the prominent near-action doorway. The lower room shelf no longer repeats a second Match Deck card and now holds three distinct things: plan, drafts, possible shared work.
4. **The People → Werkle handoff is visible.** Match Deck now shows `My Work → Match Deck → Possible Werkle` and states what stays private, what is only comparison/practice, and what would require a deliberate shared-work choice.
5. **Mobile Match Deck is function-first.** The actual candidate/empty result moved directly below the current read. Explanation and the journey no longer delay the thing the member came to see.

## Verification

- `npm run typecheck`: PASS
- Member data custody smoke: PASS
- Stable member header / Match Deck contract: PASS
- Sitewide header continuity: PASS — 77 rendered routes, 74 shared-header routes, 3 explicit exceptions
- Targeted whitespace check: PASS (line-ending warnings only)
- React best-practices review: PASS
- Profile disclosures: all three open through native summary controls; all 20 named fields remain in the form
- Workshop `Compare people` → `/dashboard/intros`: PASS
- Match Deck `Possible Werkle` → `/dashboard/werkles/formation`: PASS
- Desktop Workshop walk: PASS
- Desktop Match Deck walk: PASS
- 390px collapsed Profile walk: PASS
- 390px function-first Match Deck walk: PASS
- Browser console errors: none observed

## Evidence

- `foreman/receipts/browser-capture/m38-profile-mobile-collapsed.png`
- `foreman/receipts/browser-capture/m38-workshop-desktop.png`
- `foreman/receipts/browser-capture/m38-match-deck-desktop.png`
- `foreman/receipts/browser-capture/m38-match-deck-mobile-function-first.png`

## CBCC state

- Ender M38 packet authored; established background route not callable; COMPOSED_NOT_SENT; no receipt credited.
- Bean M38 packet authored; established background route not callable; COMPOSED_NOT_SENT; no receipt credited.
- Lady Jessica M38 packet authored; established background route not callable; COMPOSED_NOT_SENT; no receipt credited.
- No Codex subagent or substitute environment was created. Local Foreman construction and headless verification are not represented as independent cousin review.

## Boundaries

No foreground input/clipboard, credential, provider, schema/RLS, production-data, spend, route deletion, push, or deploy action. Existing dirty work remains preserved.

## Operator walk

Start `/dashboard/profile`, then use the member header `My Work`, choose `Compare people`, and inspect the function-first Match Deck. A practice candidate can continue through `Possible Werkle`; an empty deck correctly returns to Intake rather than inventing people.
