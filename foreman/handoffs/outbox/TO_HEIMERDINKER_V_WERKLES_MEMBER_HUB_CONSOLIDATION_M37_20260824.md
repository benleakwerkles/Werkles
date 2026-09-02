# V — Werkles member-hub consolidation, M37

PROJECT_ID: WERKLES
WORK_ID: MEMBER_HUB_CONSOLIDATION
CYCLE_ID: M37_20260824
SEAM_ID: PROFILE_CRUCIBLE_WORKSHOP_MATCH_DECK_IA

## Question

Can the signed-in experience feel like four understandable rooms instead of seven product labels, while preserving every mature route and saved-work boundary?

## Baseline

- Profile opens with a technical data-custody wall and repeats profile/check explanations below the form.
- Crucible is a separate top-level member tab even though checks are attributes of the member.
- Workshop and Match Deck are separate top-level concepts even though people are useful in the context of work.
- The member header exposes seven destinations.

## Build

1. Make Profile a warm `Who You Are` / `Prove It` hub with a human visual, concise check status/actions, and technical custody details demoted behind an optional disclosure.
2. Preserve `/dashboard/crucible` as the detailed provider/check room and remove its proved-empty decorative strip.
3. Pare member navigation to four durable concepts: My Work, People, Bellows, About Me.
4. Bring the people doorway forward in Workshop without deleting or faking a merge with Match Deck.

## Hard edges

No route deletion, auth/storage/provider behavior, schema/RLS, production data, credentials, spend, push, or deploy. Preserve unrelated dirty work. Do not claim saved or verified state that source cannot prove.

## Acceptance

- Profile has one H1, an inviting human-grounded first viewport, clear Who You Are and Prove It sections, and no repeated lower explanation cards.
- Header has four stable member choices while deep routes remain reachable contextually.
- Workshop exposes people/matches near its primary work controls.
- Desktop and mobile walkthroughs show no console errors, clipped copy, or broken links.

