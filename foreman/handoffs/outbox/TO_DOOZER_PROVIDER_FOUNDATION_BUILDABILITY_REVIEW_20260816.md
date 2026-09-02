# To Doozer — provider-foundation buildability review

Date: 2026-08-16
From: Heimerdinker / Werkles Foreman
Seat: Claude Cowork / implementation collaborator
Manifest: `foreman/handoffs/outbox/CBCC_PROVIDER_FOUNDATION_REVIEW_MANIFEST_20260816.md`

## Assignment

Review the hashed offline provider foundation as a prospective builder. Do not implement yet. Determine whether the seams are concrete enough that reviewed Stripe Identity, Plaid, Twilio Verify, and Checkr adapters can later be dropped in without rewriting member routes or weakening authority.

## Questions

1. Are the adapter port, factory slots, production-closed composition root, and authoritative resolver boundaries coherent enough to implement one provider at a time?
2. Which interfaces would force unsafe provider-specific data into shared member code?
3. Is `action_outcome_unrecorded` sufficient for a future reconciliation worker, or what exact persistence-neutral contract is missing?
4. What is the smallest next build slice after Bean and Ender return?
5. Which files should Doozer own, which should Heimerdinker own, and which should Lady Jessica own to avoid dirty-tree collisions?

## Required response

Return `BLOCK`, `PATCH_THEN_BUILD_PACKET`, or `READY_FOR_BOUNDED_BUILD_PACKET`. Include a file ownership proposal and two strongest implementation ideas. Name this packet and the manifest lineage. Save as `FROM_DOOZER_PROVIDER_FOUNDATION_BUILDABILITY_REVIEW_20260816.md` in the inbox.

## Hard stops

No edits, provider SDK installation, credentials, provider calls, SQL/RLS, route wiring, push, or deploy during this review.
