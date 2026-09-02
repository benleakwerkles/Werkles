# Werkles VPGM receipt: function-first walkthrough M22

Date: 2026-08-24  
Foreman: Heimerdinker / Codex local on Betsy  
State: `LOCAL_FUNCTION_FIRST_WALK_PASS__CBCC_ROUTES_UNPROVED__LJ_REVIEW_OWED`

## V — vision packet

Authored:
`foreman/handoffs/outbox/HEIMERDINKER_V_VPGM_FUNCTION_FIRST_WALKTHROUGH_M22_20260824.md`.

The checkpoint was a sellable, function-first path through Intake,
Recommendations, Workshop, and Match Deck: the useful work must precede long
explanation, copy must sound human, and the next step must be unmistakable.

## P — crew pull

Issued mission:
`foreman/crew-dispatch/missions/WERKLES_M22_FUNCTION_FIRST_WALKTHROUGH_20260824.json`.

Exact packets were created for Ender, Bean, Skybro, and Petra. Notification and
dispatch were attempted through the advertised background routes. The M repull
returned:

- Petra: `CONNECT_FAILED` — no Chrome on `127.0.0.1:9335`
- Skybro: `CONNECT_FAILED` — no Chrome on `127.0.0.1:9335`
- Ender: `CONNECT_FAILED` — no Chrome on `127.0.0.1:9335`
- Bean: `NO_POSTED_LEG`

No reply, review, implementation, or approval from those seats is claimed.

## G — strongest in-lane implementation

Reordered Workshop so the account-aware current Workshop appears directly
after the hero and before generic process explanation, terminology, decorative
imagery, and wayfinding. The member now reaches their actual saved/current work
without scrolling through a lesson first.

Changed the room heading to `Use the work already in your Workshop.`

## M1 — natural member copy

Replaced internal and diagnostic phrasing in the account-aware Workshop read:

- `Funds posture not verified` became a plain statement that money available
  for the work has not been checked yet.
- `Identity not verified` became a plain statement that identity has not been
  checked yet.
- `rule-derived, not a diagnosis` became an early read from the member's
  answers, not a verdict.
- `Unknown stays unknown` became `We won't guess.`
- `Intros comes later` became `Match Deck comes later.`

## M2 — hostile small-screen walk and contract expansion

Walked Workshop, Recommendations, and Match Deck at 390 x 844. All three held
their content inside the viewport with no console errors. Expanded the focused
contract to prove Workshop function ordering, Match Deck candidate ordering,
new plain-language copy, and removal of the old internal phrasing.

## Verification

- `npm run typecheck`: PASS
- `node scripts/foreman/walkthrough-function-first-copy-smoke.mjs`: PASS
- `npm run build`: PASS; 100 routes generated
- `git diff --check` on the product slice: PASS, line-ending warning only
- Desktop Workshop browser walk: PASS
- 390px Workshop, Recommendations, and Match Deck walk: PASS

## Independent review custody

Lady Jessica's exact-candidate packet is ready at:
`foreman/handoffs/outbox/TO_LADY_JESSICA_M22_FUNCTION_FIRST_EXACT_CANDIDATE_REVIEW_20260824.md`.

It is not marked delivered and no review is claimed.

## Boundaries preserved

No provider activation, credentials, schema/RLS operation, spend, push, deploy,
or production-state change occurred.

