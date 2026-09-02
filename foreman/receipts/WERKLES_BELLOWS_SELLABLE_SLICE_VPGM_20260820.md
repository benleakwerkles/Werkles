# Werkles Bellows sellable slice — VPGM receipt

Date: 2026-08-20
Foreman: Codex local on Betsy
Mutation: local shared working tree only
Git/provider/schema/deploy activity: none

## V — authored direction

The active direction was the Personal Bellows / public Bellows split: turn a recommendation into a real lesson and reusable artifact, while keeping session-bound personalization honest and leaving custom Werkle Pookas outside the no-image-spend gate.

## P — actual CBCC pull

Applied actual cousin artifact:

- `foreman/handoffs/inbox/FROM_PETRA_BELLOWS_TWO_SEAT_PRODUCT_RULING_20260817.md`

Petra ruled that `Proof Before Reliance` should be the first complete Bellows slice and that its useful output is an Evidence Brief separating claim, decision, sources/dates, supported facts, inference, contradiction/gap, confidence-changing evidence, and next check/Human Gate.

Fresh Personal Bellows packets to Ender, Bean, and Lady Jessica still have no returned review receipts. They are not counted as completed reviews.

## G — executed strongest returned work

- Added real `/bellows/library/[slug]` lesson routes for all four public Bellows lessons.
- Changed Recommendation bridges from one-page hash anchors to those real routes.
- Built the `Proof Before Reliance` worked example, hostile example, and editable eight-part Evidence Brief.
- Preserved unknowns visibly and avoided badges, confidence percentages, professional conclusions, or provider/account claims.

## M — bounded momentum

- Added `/bellows/personal`, which selects a short, de-duplicated reading path from the latest recommendation ranking available to the current session.
- Added `My Bellows` to Recommendations navigation.
- Kept the boundary explicit: the reading path is not yet permanently account-saved, a shared-Werkle monitor, or a custom Pooka.
- Browser walking found and fixed duplicate lesson recommendations and incorrect fixed-count heading copy.

## Proof

- `node scripts/foreman/bellows-lesson-route-smoke.mjs` — PASS
- `node scripts/foreman/personal-bellows-route-smoke.mjs` — PASS
- `node scripts/foreman/recommendation-solution-path-smoke.ts` — PASS
- `npm.cmd run typecheck` — PASS
- focused `git diff --check` — PASS (existing line-ending warning only)
- HTTP: two real lesson routes return 200; unknown lesson returns 404
- live browser: Evidence Brief has eight labeled fields and updates its preview; Personal Bellows produced unique lesson links with no body-width overflow at the active desktop viewport

## Remaining honest boundaries

- Intake/recommendation custody is still session/local rather than durable account custody.
- Personal Bellows selects from public lessons; it does not yet generate a wholly custom curriculum.
- No persistent per-Werkle Pooka or shared-Werkle activity model exists yet.
- Fresh Ender/Bean/Lady Jessica review receipts remain outstanding.
