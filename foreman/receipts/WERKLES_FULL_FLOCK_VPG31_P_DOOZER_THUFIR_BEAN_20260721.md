# VPG31 P Receipt - Doozer, Thufir, and Bean

STATUS: `COMPLETED`
CYCLE_ID: `WERKLES-FLOCK-20260721-044352-ET-BETSY-01`
LEGACY_LABEL: `VPG31`
ORDINAL_CLAIM: `NONE`
PACKET: `foreman/handoffs/outbox/TO_HEIMERDINKER_DOOZER_THUFIR_BEAN_WERKLES_PUBLIC_ACCESSIBILITY_TRUST_PROOF_VPG31_20260721.md`
PULLED_BY: `Doozer@Betsy`, `Thufir@Betsy`, `Bean@Betsy`

## Exactly two selected ideas

1. Move the single Public Test Data Notice immediately after the signed-in profile form opens, before either journey can present editable fields or a submit action.
2. Replace block and heading descendants inside each native recommendation-card button with valid phrasing markup while preserving the complete ARIA name, description, pressed-state, and control relationships.

## Evidence

- `app/dashboard/profile/page.tsx` currently renders recommendation fields and its first submit before the notice that says it should be read before adding data.
- `components/squibb/recommendation-card.tsx` currently nests `div`, `h4`, and `p` inside `button`; the surrounding section already has its own heading.
- Existing VPG25/VPG26 tests pass but do not assert either trust or content-model boundary.
- VPG17's exact two-link assertion and VPG24's exact older wording were rejected as stale doctrine, not product defects.

PULL COMPLETED
