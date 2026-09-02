# Concierge Page 0 + Member Walkthrough Attack

Date: 2026-08-14  
Owner: Heimerdinker / Dink@Betsy  
Machine lane: **Betsy = Werkles**  
Out of scope: **Doss = PookaKind**

## Operator direction

Repair the illegible Concierge Page 0 at `/bellows/recommendations`, then
prepare a full Werkles walkthrough as an authenticated member today.

## Two strongest ideas

1. Repair the dark-page CSS cascade and empty-recommendation navigation state,
   then prove the important text and controls remain readable on desktop and
   narrow screens.
2. Inventory and smoke the complete member route so the walkthrough follows a
   deliberate path and identifies navigation dead zones before Ben reviews it.

## Hard edges

- Preserve the shared dirty worktree and all existing local work.
- No Werkles production push or deployment without Ben + Heimerdinker + Lady
  Jessica signoff; Lady Jessica remains the only push/deploy hand.
- No database, schema, secret, provider-account, billing, or authentication
  changes in this slice.
- Do not touch PookaKind or Doss.
- Repair and verify locally first; report the exact live-release gate rather
  than implying the live page changed.

## Required receipt

Name the files changed, desktop/mobile proofs, member-route findings, remaining
functional or human gates, and whether the local preview is ready for Ben.
