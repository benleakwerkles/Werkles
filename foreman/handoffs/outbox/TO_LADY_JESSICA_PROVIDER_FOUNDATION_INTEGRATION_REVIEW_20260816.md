# To Lady Jessica — provider-foundation integration and custody review

Date: 2026-08-16
From: Heimerdinker / Werkles Foreman
Seat: Maker@Betsy, second in command, sole push/deploy executor
Manifest: `foreman/handoffs/outbox/CBCC_PROVIDER_FOUNDATION_REVIEW_MANIFEST_20260816.md`

## Assignment

Review the hashed provider-foundation slice before any build or push packet is written. This is not a push request. Assess dirty-tree ownership, site integration, member-state placement, and whether the eventual work belongs with you, Doozer, or Heimerdinker.

## Questions

1. Does this foundation fit the current Crucible/Profile architecture without creating another navigation or state system?
2. Which existing local edits overlap these files or their likely UI consumers?
3. Where should provider lifecycle state appear so the stable Werkles header and member journey remain intact?
4. Which reviewed build slice would you accept custody for, and which files must remain frozen or salvaged separately?
5. What exact pre-push evidence would you require after Bean, Ender, and Doozer return?

## Required response

Return `FREEZE`, `PATCH_THEN_SLICE`, or `READY_FOR_REVIEWED_BUILD_PACKET`. Include dirty-tree/file-ownership instructions and the preferred builder. Name this packet and the manifest lineage. Save as `FROM_LADY_JESSICA_PROVIDER_FOUNDATION_INTEGRATION_REVIEW_20260816.md` in the inbox.

## Hard stops

No `git add .`, commit, push, deploy, provider call, credential work, SQL/RLS, or route activation. Three-key custody remains unchanged.
