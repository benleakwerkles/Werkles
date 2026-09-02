# TO LADY JESSICA - AUTONOMOUS MATCHING UI UX CLEANUP PREVIEW VPG10

Packet: `TO_LADY_JESSICA_AUTONOMOUS_MATCHING_UI_UX_CLEANUP_PREVIEW_VPG10_20260717`
Primary seat: `LadyJessica@Betsy` / Cursor@Betsy
Supporting seats: Ender/Doozer for member-language clarity
Execution and scoped push owner: `Dink@Betsy` / Heimerdinker
Repository: `C:\Users\Ben Leak\github\Werkles`
Branch: `maker/site-g-20260703`
Public state: Autonomous Matching ON; LLM OFF; VPG8 containment LIVE on production
Operator order: cleanup UI/UX (clunky/ugly) as separate Preview-only slice after containment approve

## Goal

Make the public recommendations surface feel like one readable composition instead of stacked panels, without a second Production redesign deploy and without weakening VPG8 containment markers.

## Two G ideas

1. **Layout declutter (Preview):** Simplify the hero to brand + headline + short support + example note; inline need/source meta; drop the redundant stack title; collapse Reasoning and Evidence behind `<details>` so Selected + Rules score + gates + save-closed stay primary.
2. **CSS hierarchy pass (Preview):** Tighten spacing and panel chrome on the recommendation route; keep all VPG8 contrast tokens and marker strings required by `scripts/foreman/test-matching-vpg8-surface.mjs`.

## Allowed product scope

- `components/squibb/recommendation-surface.tsx`
- `components/squibb/reasoning-panel.tsx` (collapse wrapper only; copy unchanged)
- `components/squibb/evidence-section.tsx` (collapse wrapper only; copy unchanged)
- `app/bellows/recommendations/squibb-recommendations.css`
- packets and receipts
- focused VPG8 surface proof + local route load

## Forbidden without new Operator phrase

- production deploy / alias / flag flip
- git push or merge
- `MATCHING_LLM_TRANSLATE_ENABLED`
- SQL / schema / secrets
- redesign of non-recommendation pages

## Acceptance

- VPG8 surface proof still PASS
- empty ledger stays hidden
- source document stays collapsed by default
- save controls remain disabled with beta copy
- no Confidence % on recommendation cards/detail Rules score path
- Preview-only until separate push/deploy phrase

`READY FOR P`
