# Werkles Evidence Brief Decision Bridge — VPGM Receipt

Date: 2026-08-20  
Execution: Heimerdinker local hands on Betsy  
Actual-CBCC source used: `foreman/handoffs/inbox/FROM_PETRA_BELLOWS_TWO_SEAT_PRODUCT_RULING_20260817.md`

## What changed

- Converted Petra's **Proof Before Reliance** ruling into a bounded Evidence Brief decision engine.
- The engine separates claim, date/source support, inference, contradiction, gap, confidence changer, next check, freshness, and professional-review status.
- It fails closed as `incomplete`, `contradiction`, `stale_or_unknown`, or `human_review`; the most favorable result is only `ready_for_next_check`, never verified or approved.
- The Bellows lesson now exposes the three explicit checks, explains the resulting bridge state, saves a device draft in `localStorage`, and can clear that device draft.
- The draft is explicitly not account-saved or shared.

## Proof

- `npx.cmd tsx scripts/foreman/evidence-brief-decision-smoke.ts` — PASS
- `node scripts/foreman/bellows-lesson-route-smoke.mjs` — PASS
- `npm.cmd run typecheck` — PASS
- scoped `git diff --check` — PASS
- Browser save/reload: eight text fields and three decision selectors restored exactly.
- Browser decision readout: `The brief is ready for its next bounded check.`
- Browser mobile check: viewport `390`, document width `412`; no page overflow beyond the browser scrollbar allowance.
- Browser console: no application errors.

## Boundaries

- No LLM, provider, payment, schema, environment, secret, deployment, or external send.
- No claim of verification, professional approval, or account persistence.
- Petra's returned packet informed the build; no claim is made that Petra reviewed this implementation.

