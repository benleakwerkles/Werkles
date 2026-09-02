# Push-scope inventory — VPG10 UI + document-score scoreboard

Date: 2026-07-17  
Seat: LadyJessica@Betsy  
Purpose: When Operator phrases push, Heimerdinker/Dink stages **only** this list. Do not absorb the rest of the dirty tree.

## Include (intended push scope)

### Product

- `components/squibb/recommendation-surface.tsx`
- `components/squibb/reasoning-panel.tsx`
- `components/squibb/evidence-section.tsx`
- `app/bellows/recommendations/squibb-recommendations.css`
- `app/operator/matching/document-score/` (entire tree)
- `app/api/operator/matching/document-score/` (entire tree)
- `scripts/foreman/test-matching-vpg8-surface.mjs` (only if diff is Matching-proof related; review before stage)

### Cockpit / packets / receipts

- `foreman/handoffs/outbox/TO_LADY_JESSICA_AUTONOMOUS_MATCHING_UI_UX_CLEANUP_PREVIEW_VPG10_20260717.md`
- `foreman/handoffs/outbox/TO_HEIMERDINKER_OPERATOR_MATCHING_TEST_SUBJECT_VPG10_20260717.md`
- `foreman/receipts/WERKLES_AUTONOMOUS_MATCHING_UI_UX_CLEANUP_PREVIEW_VPG10_LADY_JESSICA_20260717.md`
- `foreman/receipts/WERKLES_DOCUMENT_SCORE_VISIBILITY_FIX_20260717.md`
- `foreman/receipts/WERKLES_LADY_JESSICA_PG_LATE_20260717.md`
- `foreman/receipts/WERKLES_LADY_JESSICA_PG_IDLE_20260717.md` (this cycle, if present)
- `foreman/reviews/DRAFT_FOR_HEIMERDINKER_GATE-matching-owner-binding-tier-b-20260717.md`
- `foreman/NEXT_ACTION.md`

Optional if already local and Matching-scoped:

- `foreman/receipts/WERKLES_LADY_JESSICA_PG_VPG10_TEST_SUBJECT_HANDOFF_20260717.md`
- `foreman/receipts/WERKLES_LADY_JESSICA_PG_VPG9_REFRESH_20260717.md`
- `foreman/receipts/WERKLES_AUTONOMOUS_MATCHING_PREVIEW_TRUTH_REFRESH_VPG9_LADY_JESSICA_20260717.md`
- `foreman/reviews/MATCHING_UI_UX_VPG10_STATIC_MOCK.html`

## Exclude

- Any path outside Matching / Squibb recommendations / document-score / related foreman notes
- `.env*` / secrets
- Unrelated app, lib, Harvey, Foundry, Stripe, Ghost Forge churn

## Pre-push proofs (already green locally tonight)

- `node scripts/foreman/test-matching-vpg8-surface.mjs` → PASS
- GET `:3000/operator/matching/document-score` → 200
- POST document-score → 200, scoreboard present, `persisted=false`

## Human gate

```text
STOP: HUMAN GATE — push requires Operator phrase
```

`INVENTORY ONLY — NO PUSH PERFORMED`
