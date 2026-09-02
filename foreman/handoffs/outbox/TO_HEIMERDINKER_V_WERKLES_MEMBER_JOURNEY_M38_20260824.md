# BV — Werkles member journey M38

PROJECT_ID: WERKLES
WORK_ID: MEMBER_JOURNEY_CONSOLIDATION
CYCLE_ID: M38_20260824
SEAM_ID: PROFILE_PROGRESSIVE_EDITOR__FOUR_ROOM_NAV__WORK_TO_PEOPLE_TO_WERKLE

## Broad checkpoint

Make the new four-room signed-in structure feel intentionally connected rather than merely renamed.

## Workstreams

1. Profile: replace the 7,000px mobile form wall with progressive sections while preserving every field and the existing account-save behavior.
2. Member navigation: test the four-room header for duplicate labels and false merging; keep deep routes reachable contextually.
3. My Work → People → Werkle: make the transition explain what carries forward and what remains private; never imply contact, agreement, or merge.
4. Copy/visual continuity: remove internal diagnostics and repair any dark-surface contrast defect found in the walked path.

## Hard edges

No route deletion, schema/RLS, storage/auth behavior, provider action, credentials, spend, production data, push, or deploy. No Codex subagents or new environments. Preserve unrelated dirty work.

## Acceptance

- Profile remains fully editable but presents one manageable section at a time on phone and desktop.
- Member header has four distinct destinations and no duplicate concept labels within the member row.
- Workshop explains the people handoff and Match Deck returns a clear path toward a possible Werkle.
- Desktop and 390px path walk passes without console errors or hidden/clipped controls.

