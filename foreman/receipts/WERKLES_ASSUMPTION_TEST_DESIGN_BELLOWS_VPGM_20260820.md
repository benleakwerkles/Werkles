# Werkles Assumption Test Design Bellows — VPGM receipt

Date: 2026-08-20  
Execution context: CODEX_LOCAL on Betsy  
Vision packet: `foreman/handoffs/outbox/V_HEIMERDINKER_ASSUMPTION_TEST_DESIGN_BELLOWS_20260820.md`

## Actual-CBCC basis

- Thufir / Computer: `foreman/handoffs/inbox/FROM_COMPUTER_VPGM_20260817-233453.md`
- Petra: `foreman/handoffs/inbox/FROM_PETRA_BELLOWS_TWO_SEAT_PRODUCT_RULING_20260817.md`

Thufir called Assumption Test Design the next Bellows room after Proof Before Reliance: turn the unresolved gap into a small, falsifiable, time-bounded learning action. Petra ruled that Bellows fails if it only says to gather more information or be skeptical.

## Outcome

Public Bellows now has a fifth complete lesson, `Assumption Test Design`, plus a usable eight-field working card. The card forces the member to name the decision, riskiest assumption, disconfirming reason, relevant source or audience, smallest honest test, pass/revise/stop rule, deadline/cost cap, and what remains unknown.

It does not save, send, verify, rank, or promise an outcome. It can copy a complete working draft. The current Personal Bellows mapper now routes decision-translation and protected-income experiments into this lesson when those recommendations are selected.

The lesson is grounded in the current SBA market-research page, which distinguishes broad existing-source research from direct research about a specific business/customer question.

## Exact files

- `lib/bellows/operator-library.ts`
- `app/bellows/library/page.tsx`
- `app/bellows/library/[slug]/page.tsx`
- `app/bellows/library/bellows-library.css`
- `lib/squibb/recommendation-solution-path.ts`
- `components/bellows/assumption-test-card.tsx`
- `scripts/foreman/assumption-test-design-bellows-smoke.mjs`
- `scripts/foreman/bellows-lesson-route-smoke.mjs`

## Walk proof

Actual local browser walk at `390×844`:

- dedicated route loaded with 3,691 characters of substantive content;
- eight labeled text areas rendered;
- Copy action updated its live status correctly;
- one-column form layout and zero document horizontal overflow;
- no framework error overlay or page errors;
- WCAG A/AA automated audit: zero violations after darkening the small copper lesson number from its initial 4.15:1 failure.

## Contract proof

- `node scripts/foreman/assumption-test-design-bellows-smoke.mjs` — PASS
- `node scripts/foreman/bellows-lesson-route-smoke.mjs` — PASS
- `node scripts/foreman/personal-bellows-route-smoke.mjs` — PASS
- `npx.cmd tsx scripts/foreman/personal-bellows-learning-path-smoke.ts` — PASS
- `npm.cmd run typecheck` — PASS
- scoped `git diff --check` — PASS

No provider call, credential or environment inspection, schema/RLS change, staging, commit, push, or deployment occurred.
