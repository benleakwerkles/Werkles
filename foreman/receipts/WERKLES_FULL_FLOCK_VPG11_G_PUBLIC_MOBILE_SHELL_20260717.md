# Werkles Full Flock VPG11 — G Receipt: Public Mobile Shell

Status: `COMPLETED`
Machine: `Betsy`
Product commit: `2025613f38dab055e7f75f8142714ffeac25f8a0`
Branch: `codex/werkles-full-flock-vpg11-20260717`
Production: untouched

## Idea 1 — contain the existing public shell

- stacked the existing header grid below 820px
- wrapped the existing five-link primary navigation without adding a menu or state machine
- kept brand, Sign in, CTA, destinations, and focus order intact
- contained the Discovery phone hero with route-local shrink/wrap/type-scale rules

## Idea 2 — make mobile targets and focus deliberate

- set header navigation, Sign in, and CTA to a 44px mobile minimum
- added a 3px high-contrast `:focus-visible` outline

## Proof

- 16 browser combinations: four routes × 320/390/640/1440px
- body overflow: `0` in every combination
- root overflow: `0` in every combination
- brand/nav/actions collisions: `0` in every combination
- mobile minimum target height: `44px`
- primary destinations present: `5`
- Discovery hero children contained at 320px
- browser console/page issues: `0`
- closed-action POSTs: `0`

Return: `COMPLETED`
