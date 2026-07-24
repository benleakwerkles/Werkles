# VPG36 P Receipt - Doozer / Thufir / Bean

STATUS: `COMPLETED`
CYCLE_ID: `WERKLES-FLOCK-20260721-202753-ET-BETSY-01`
LEGACY_LABEL: `VPG36`
ORDINAL_CLAIM: `NONE`
PACKET: `foreman/handoffs/outbox/TO_HEIMERDINKER_DOOZER_THUFIR_BEAN_WERKLES_SELECTION_ACCESSIBILITY_FIDELITY_VPG36_20260721.md`
PULLED_BY: `Doozer@Betsy`, `Thufir@Betsy`, `Bean@Betsy`
EXECUTION_OWNER: `Heimerdinker@Betsy`
MODE: `READ_ONLY_PULL`

## Current truth pulled

- Each card describes meta, a long visible headline, score, and an always-referenced flags span that may be empty, creating noisy keyboard scanning.
- The selected status mounts with text and duplicates the focused card's pressed state, while not saying that the controlled detail changed.
- Native button semantics, pressed state, detail association, user-invoked focus paths, gate visibility, and current source hashes pass.

## Exactly two selected ideas

1. Keep the visible headline but shorten each card's `aria-describedby` to existing meta and score IDs, adding the flags ID only when review/blocker truth exists.
2. Make the live selection message empty initially and update it only for a valid changed card to `Details updated for <title>.`; same or unknown IDs fail closed with no selection/announcement, focus, or scrolling.

No custom widget, hidden gate/score truth, automatic focus/scroll, new destination, or gate.

COMPLETED
