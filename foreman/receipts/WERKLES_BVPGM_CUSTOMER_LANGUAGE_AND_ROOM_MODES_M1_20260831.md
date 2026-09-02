# Werkles BVPGM — Customer Language and Room Modes — M1

Date: 2026-08-31
Foreman: Heimerdinker on Betsy
Execution: local source and localhost only
Push/deploy/provider/schema/secret mutation: none
Subagents/new environments: none

## Operator direction

- Remove customer-visible personal Operator naming.
- Remove customer-visible Squibb/Speaker cross-identities.
- Retire “What is the heaviest thing you are carrying?”
- Keep one Werkles design system while making Public Bellows, Private Bellows,
  Proof, Membership, Workshop, People, and Shared Werkle feel like distinct
  rooms.

## Independent review rotation

- Doozer/Orson: terminal PATCH on the proposed implementation. Required a
  deterministic room identity, explicit public/private Bellows distinction,
  non-color cues, mobile continuity, and a route-matrix contract.
- Petra: terminal PATCH on the proposed implementation. Required immediate
  privacy clarity, Proof-as-evidence rather than Proof-as-approved, separate
  Workshop/Shared Werkle orientation, and organizational accountability after
  personal-name cleanup.
- Petra post-build return: terminal GO. Privacy ambiguity, implied verification,
  authority drift, organizational accountability, and the bounded room-system
  separation passed her review.
- Doozer post-build return: terminal GO. Route identity, public/private
  distinction, non-color cues, one-site continuity, Workshop/Shared Werkle
  separation, mobile header behavior, and customer-copy exclusions passed his
  hostile evidence review. He independently reran no source or tests, so his GO
  is correctly scoped to the supplied build and browser proof.

## Implemented

- Shared header maps every target route to `data-werkles-room`.
- Small stable room tags provide a non-color cue:
  `Public Bellows`, `Private Bellows`, `Proof Workspace`, `Membership`,
  `Workshop`, `People`, and `Shared Werkle`.
- Bounded header-accent and page-wash tokens vary by room; header structure,
  wordmark, typography, buttons, spacing grammar, and navigation remain shared.
- Target page roots carry their exact room class.
- Customer-visible personal Operator naming was removed from app/component
  surfaces; matching delivery, navigation tooltips, worked examples, metadata,
  alt text, and explanatory copy no longer present Squibb or Speaker as a
  customer-facing author or system.
- The retired intake sentence is absent; the stable internal field ID remains
  unchanged to preserve saved-answer custody.

## Verification

- `npm run build`: PASS (100 static pages generated; full route manifest built)
- sequential `npx tsc --noEmit`: PASS
- `node scripts/foreman/customer-language-room-modes-smoke.mjs`: PASS
- `node scripts/foreman/sitewide-header-continuity-smoke.mjs`: PASS — 77 routes,
  74 shared-header routes, 3 explicit exceptions
- `node scripts/foreman/test-concierge-intake-legibility.mjs`: PASS
- targeted `git diff --check -- app components lib scripts/foreman/customer-language-room-modes-smoke.mjs`: PASS
- Desktop localhost walk: nine room routes returned distinct room identities,
  tags, and computed header accents; forbidden rendered strings absent.
- 390px localhost walk: all room tags visible; no target route overflowed.
- Recommendations, worked example, and Spark rendered-string scan: PASS.

## Existing unrelated verification debt

- `stable-member-header-match-deck-smoke.mjs` rejects the word
  `Recommendations` anywhere in `lib/site-nav.ts`, including the route-context
  map. The member navigation itself remains `My Work`, `Match Deck`, `Bellows`,
  and `About Me`. This stale assertion was not rewritten during this bounded
  room-mode pass.
- Whole-tree `git diff --check` still reports pre-existing trailing whitespace
  in unrelated Foreman files. The bounded product-source diff check passes.
