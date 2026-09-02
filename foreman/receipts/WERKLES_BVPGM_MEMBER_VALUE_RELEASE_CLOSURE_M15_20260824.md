# Werkles BVPGM — member-value release closure M15

Date: 2026-08-24  
Foreman: Heimerdinker@Betsy  
Status: `PETRA_POSTBUILD_GO__LOCAL_CONTINUITY_CLOSED__GATE_05_HOLD`

## Broad checkpoint

Improve the release candidate across member continuity, matching/Formation,
Personal Bellows, provider-readiness boundaries, and copy/visual continuity
without implying account, partner, provider, or release custody.

## V

- Vision packet:
  `foreman/handoffs/outbox/HEIMERDINKER_V_BVPGM_MEMBER_VALUE_RELEASE_CLOSURE_M15_20260824.md`
- Pre-build mission:
  `foreman/crew-dispatch/missions/WERKLES_BVPGM_MEMBER_VALUE_RELEASE_CLOSURE_M15_20260824.json`
- Post-build mission:
  `foreman/crew-dispatch/missions/WERKLES_BVPGM_M15_MEMBER_CONTINUITY_POSTBUILD_20260824.json`

## Pull

Seven unread Computer receipts blocked the fresh dispatch. The Foreman read and
resolved them rather than overwriting crew evidence:

- five stale, duplicate, malformed, or incomplete receipts were quarantined
  with explicit reasons;
- the complete M11 pre-build and post-build Computer receipts were consumed and
  assimilated;
- their strongest current findings were verified against source: the FTC
  resource URL resolves, `Work on next` is neutral, and the Exit copy already
  preserves the independent-adviser boundary.

Petra then returned a terminal `PETRA_M15_PATCH` authorizing exactly two
client-only changes with Gate 05 held.

## G

### 1. Match Deck continuity

The Match Deck now validates the existing device Operating Brief before showing
a return path. A member with local work sees:

- `A practice Werkle is already on this device`
- `Continue Existing Werkle`
- a separate `Start Another Practice Werkle` choice after inspecting a profile

The saved room is not replaced or silently connected to the selected profile.

### 2. Personal Bellows continuity

Personal Bellows now presents the validated saved brief as the same local
practice chain, including saved date and accepted-topic count, while stating
that returning does not mean the other person responded or accepted anything
new.

### Files changed

- `components/ghost-fleet/ghost-member-interaction-lab.tsx`
- `components/bellows/bellows-device-draft-shelf.tsx`
- `app/globals.css`
- `app/bellows/library/bellows-library.css`
- `scripts/foreman/match-deck-shared-werkle-preview-browser-smoke.mjs`

Exact five-file digest:

`258c6d994d20139399b872293e2864bed0609b1fd3a7b3e0d5996eba93bb979f`

## Verification

- TypeScript: PASS
- Match Deck → Formation → shared action → Personal Bellows → Crucible: PASS
- M11 Formation return: PASS
- M12 topic experiment return: PASS
- M13 result return and stale invalidation: PASS
- Practice Boundary Readout: PASS
- Personal Bellows device shelf: PASS
- Production build: PASS, 100 generated static pages
- `git diff --check` on the exact five-file candidate: PASS except the existing
  line-ending warning for `app/globals.css`

The first build attempt stopped on the known locked
`foreman/.edge-aeye-crew-profile/Default/Network/Cookies` file. The Foreman
closed only the dedicated minimized crew Edge processes and reran the unchanged
build successfully.

## Post-build red team

Petra returned terminal `PETRA_M15_POSTBUILD_GO` for the exact digest. Petra
confirmed both acceptance gates and retained the distinctions between:

- local continuity;
- account durability;
- partner response or agreement;
- provider evidence;
- independent release custody.

Gate 05 remains `HOLD`.

## Rotation truth

- Petra: pre-build terminal `PATCH`, assimilated; post-build terminal `GO`,
  assimilated.
- Computer: two prior current receipts pulled and assimilated before work.
- Ender, Bean, Skybro, Computer fresh M15 routes: receiver signed out or
  otherwise not callable; no fresh M15 work claimed.
- Lady Jessica: independent exact-candidate custody still owed; no callable
  existing-task route proved.

This is a completed reviewed slice, not a completed five-seat rotation and not
a release authorization.

## Hard stops preserved

No credentials, schema/RLS, provider activation, paid calls, production-data
mutation, push, deploy, public launch, Codex subagent, new environment, or
foreground input.

