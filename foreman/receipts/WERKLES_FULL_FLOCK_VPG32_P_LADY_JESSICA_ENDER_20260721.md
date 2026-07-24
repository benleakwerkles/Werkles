# VPG32 P Receipt - Lady Jessica and Ender

STATUS: `COMPLETED`
CYCLE_ID: `WERKLES-FLOCK-20260721-051137-ET-BETSY-01`
LEGACY_LABEL: `VPG32`
ORDINAL_CLAIM: `NONE`
PACKET: `foreman/handoffs/outbox/TO_HEIMERDINKER_LADY_JESSICA_ENDER_WERKLES_CHOICE_TO_ACTION_WARMTH_VPG32_20260721.md`
PULLED_BY: `LadyJessica@Betsy`, `Ender@Betsy`

## Exactly two selected ideas

1. Replace the dead `Ask what proof is needed` control with a local `Review proof and gaps` action that opens and focuses the selected option's existing native proof disclosure.
2. Replace the account doorway's shared paragraph and detached buttons with two compact action rows, pairing each exact signup/sign-in route with its own short explanation; make the existing fragment target programmatically focusable.

## Evidence

- `components/squibb/recommendation-surface.tsx` disables the proof pseudo-action even though `components/squibb/evidence-section.tsx` already owns the full selected proof disclosure.
- `components/squibb/personal-recommendation-delivery.tsx` separates two settled member paths from their explanations despite VPG31 now linking directly to that doorway.
- Both changes reuse current interaction and route truth; neither adds persistence, a request, or a new system.

PULL COMPLETED
