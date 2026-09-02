# Heimerdinker V — Member Flow System

**Checkpoint:** Restore one coherent Werkles journey without flattening every room into the same page.
**From:** Heimerdinker@Betsy / Werkles Foreman
**Date:** 2026-09-01
**Status:** V authored; focused CBCC review required before a broad visual/copy implementation.

## Operator diagnosis

Werkles has moved from too many similar pages to too few pages carrying too many jobs. The second condition is easier to repair, but the current implementation lacks flow:

- copy sounds as though several voices were layered without a final editor;
- too many colors appear inside each route, weakening room identity;
- important sections compete instead of leading into one another;
- members can lose track of which room they are in and what comes next;
- the shared header identifies rooms, but the page body does not always keep that promise.

## Rendered evidence

Heimerdinker personally inspected the local member journey on desktop:

1. `/bellows/recommendations` has numerous simultaneous labels and continuations. Recommendations, people, working draft, Workshop, and Personal Bellows all ask for attention.
2. `/dashboard/blueprints` carries at least eight conceptual sections before leaving the room.
3. `/dashboard/profile` is currently classified as `Workshop` by the shared header and has no route-room class of its own.
4. Public Bellows uses copper while Personal Bellows uses teal, visually implying a move into the People lane instead of a deeper/private state of Bellows.
5. `/dashboard/intros` and `/dashboard/crucible` have clearer single jobs than Recommendations and Workshop and should be used as comparative evidence, not copied wholesale.

## Shared flow contract to review

Every member route should answer these in the first viewport:

1. **Where am I?** One stable room name plus one restrained room accent.
2. **What is this room for?** One sentence, in customer language.
3. **What is the main thing I can do here?** The page's working surface, not several equal calls to action.
4. **What happens after I do it?** One primary continuation; secondary continuations remain visible but quiet.

Every long route should use this rhythm:

`arrival → main work → useful consequence → one next room`

Rooms share the same Werkles shell, typography, spacing, button grammar, and base palette. A room may own one accent, one environmental motif, and one small transition cue. The accent may not recolor every card or introduce a second visual system.

## Workstreams

1. **Visual continuity / Lady Jessica:** reduce color noise, define restrained room signatures, restore one clear focal level.
2. **Experience flow / Ender:** test orientation, cognitive load, section order, and transitions across the member journey.
3. **Narrative continuity / Skybro:** establish one human voice and remove layered insider copy without making the product sound generic.
4. **Trust semantics / Bean:** attack misleading saved-state, result, room, verification, and next-step claims.

## Hard edges

- Review first. Do not implement from this V alone.
- No new route sprawl merely to reduce density.
- No giant one-page dashboard merely to reduce navigation.
- No new palette. Work within the existing Werkles palette and reduce simultaneous hues.
- Do not rename product rooms casually.
- Do not alter auth, persistence, schema, provider activation, money, privacy, push, or deploy state.
- Packet delivery is not a receipt. Only a validated personal terminal response counts.

## Momentum order

1. Harvest the four independent reviews.
2. Reconcile them into one room/flow matrix.
3. Implement the smallest coherent cross-route slice.
4. Walk desktop and mobile.
5. Rotate the built slice back through Lady Jessica, Ender, and Bean before any push recommendation.

