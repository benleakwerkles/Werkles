# Werkles Personal Bellows working path — VPGM receipt

Date: 2026-08-20  
Foreman: Heimerdinker / Codex local on Betsy  
Mutation: shared local working tree only  
Git/provider/schema/deploy/spend activity: none

## V

Authored and executed:

- `foreman/handoffs/outbox/V_HEIMERDINKER_PERSONAL_BELLOWS_WORKING_PATH_20260820.md`

The Personal Bellows path now converts current recommendation reasoning into
useful work instead of merely listing de-duplicated public lesson links.

## P — actual CBCC returns used

- Bean:
  `foreman/handoffs/inbox/FROM_BEAN_PERSONAL_BELLOWS_SOURCE_BACKED_REVIEW_20260820.md`
- Petra:
  `foreman/handoffs/inbox/FROM_PETRA_BELLOWS_TWO_SEAT_PRODUCT_RULING_20260817.md`
- Ender:
  `foreman/handoffs/inbox/FROM_ENDER_VPGM_20260816-223710.md`

Applied rules: explicit personal/public boundary; no private payload passed to
public lessons; explain why a lesson appears; produce a reusable result rather
than generic advice; plain language before workshop mythology; no persistent
Pooka or cross-member sharing claim.

## G

1. Added pure `buildPersonalBellowsLearningPath(session)`. It rejects demo and
   non-member source documents, requires a tailored executable plan, removes
   duplicate public lessons, and returns at most three frozen steps.
2. Rebuilt `/bellows/personal` cards around four useful parts: Werkles's read,
   a twenty-minute exercise, the output to leave with, and the finish line.
3. Added runtime/source proof that demo sessions yield no path, raw Intake
   sentences are not echoed into output, lesson links remain unique, and every
   step contains substantive work.

## Proof

- `node scripts/foreman/personal-bellows-route-smoke.mjs` — PASS
- `npx.cmd tsx scripts/foreman/personal-bellows-learning-path-smoke.ts` — PASS
- `npm.cmd run typecheck` — PASS
- scoped `git diff --check` — PASS
- live `/bellows/personal` at desktop: two distinct tailored steps, eight work
  blocks, zero console warnings/errors, document width contained
- live phone-width check: one-column work blocks, two steps, zero document
  overflow, zero console warnings/errors; viewport restored afterward

## Boundaries still open

- Personal Bellows uses the current session/account-read path; no new permanent
  curriculum or progress record was created.
- Bean's requested durable purpose-consent/audit system remains a future
  persistence/schema design gate; this local slice does not claim it exists.
- No Pooka generation, provider comparison, paid content, or cross-member
  lesson sharing was implemented.
