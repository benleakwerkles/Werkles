# TO LADY JESSICA - AUTONOMOUS MATCHING READABILITY VPG8

Packet: `TO_LADY_JESSICA_AUTONOMOUS_MATCHING_READABILITY_VPG8_20260716`
Primary seat: `LadyJessica@Betsy` / Cursor@Betsy
Execution and scoped push owner: `Dink@Betsy` / Heimerdinker
Repository: `C:\Users\Ben Leak\github\Werkles`
Branch / starting HEAD: `maker/site-g-20260703` / `92a30814a244fd99a3df0fd334103f984431a76c` (go-live receipt advanced branch to `d183d8b` during P)
Public state: Autonomous Matching ON by durable operator approval; LLM OFF

## Goal

Turn the visually dark and overconfident recommendation preview into a readable, honest public surface without redesigning the page or building a new component system.

## Two G ideas

1. Add a recommendation-only `Rules score` variant: `N out of 100`, `Support band: <band>`, and a proximate statement that it is not probability, eligibility, or predicted outcome. Preserve the shared meter's default behavior for non-Matching walkthrough/readout consumers. Remove the score from recommendation cards rather than repeating a misleading percentage.
2. Repair page-scoped contrast using the existing workshop palette so headings, body copy, evidence, gates, and empty states are readable while preserving the current layout and visual identity.

## Allowed product scope

- `components/squibb/confidence-meter.tsx`
- `components/squibb/recommendation-card.tsx`
- `components/squibb/human-gate-strip.tsx` (complete copy-only diff; gate structure must remain identical)
- `lib/squibb/recommendations.ts` (complete copy-only diff; recommendation/gate structure must remain identical)
- `app/bellows/recommendations/squibb-recommendations.css`
- one focused VPG8 test
- packets and receipts

## Acceptance

- no `%` or `Confidence` label in recommendation cards or selected detail
- selected detail says `Rules score` and `N out of 100`
- support bands are `Limited rule support`, `Moderate rule support`, and `Stronger rule support`
- non-Matching consumers retain their existing confidence presentation
- browser screenshot is materially readable at desktop width
- no layout rewrite, new design system, animation subsystem, or unrelated page edit
- typecheck, production build, browser load, and focused proof pass

## P patch

The current page-scoped pale token override fails contrast on the inherited light paper canvas, and the shared meter change mislabels non-Matching consumers. G must use explicit dark ink on light panels and light ink only on dark cards/items.

The first P boundary excluded dirty `human-gate-strip.tsx` and `lib/squibb/recommendations.ts`. The pre-stage reproducibility review proved that omitting those complete copy-only diffs would restore internal Operator/Dink/Petra/Crucible/Ben wording in a clean checkout and invalidate the browser proof. Thufir and Lady Jessica/Ender therefore reviewed the full diffs for adoption. Their stop condition is strict: IDs, kinds, ranks, scores, evidence structure, gate IDs/kinds/severities, and all `benMustApprove` values must remain identical to HEAD. Only the reviewed member-language substitutions are admitted.

`READY FOR P`
