# Free Workshop sandbox — current-surface inventory

Date: 2026-08-01
Seat: Codex Foreman / Dink @ Betsy
Source Vision: `LADY_JESSICA_V_FREE_WORKSHOP_SANDBOX_20260731.md`
Environment: canonical local repo; review-only; no production action

## Product truth at the current floor

| Surface | What exists now | Honest classification |
|---|---|---|
| Account, onboarding, profile | Real account/profile flows; profile facts and `blueprint_narrative` have persisted fields | **Free and functional** |
| Member home | Authenticated dashboard with routes to profile, workshops, intros, Crucible, and Bellows | **Free and functional** |
| Bellows | Intake and recommendation routes exist; production submission remains controlled by its separate intake gate | **Free/readable; submission state must be labeled from runtime truth** |
| Workshop route | `/dashboard/blueprints` is a static orientation card; it does not yet list, create, or edit real blueprint rows | **Scaffold, not a working room** |
| Workshop narrative | Onboarding can save one narrative on the member profile | **Real seed data, thin UI** |
| Intros | Members can load their own queue; database policy permits new intro requests only for active paid members | **Queue visible; creation is paid-gated** |
| Crucible | Member surface exists; identity/funds integrations are test/sandbox paths and verification requests require active membership | **Visible preview; paid/provider-gated action** |
| Membership/billing | Plan and status surfaces exist; checkout availability is runtime-controlled | **Real surface; live-money claims must follow runtime truth** |
| Shared documents | No member-facing document shelf or collaboration flow exists | **Not built** |
| Whiteboard/brainstorming | No shared whiteboard exists | **Not built** |
| Team bench | Blueprint membership schema exists, but there is no complete member-facing team-management room | **Foundation only** |
| Vendor shelf | Vendor schema exists, but there is no complete member-facing vendor workflow | **Foundation only** |
| Operator/matching tools | Operator routes, matching internals, SoleDash, and TinkerDen exist for operations | **Hidden internal; never sell as member furniture** |

## Recommended first product boundary

### Free and genuinely useful

1. One Workshop home built around the member's existing profile and
   `blueprint_narrative`.
2. One decision board: what I know, what Werkles noticed, and the next useful
   move.
3. Profile notes and the first Bellows recommendation linked into the room.
4. Read-only proof guidance and a clear path back to the member floor.

This first slice should reuse current data and avoid schema, provider, or live
payment work.

### Visible paid direction

- People bench / partner collaboration
- shared document shelf
- whiteboard
- guarded intro request
- verification actions
- vendor comparison shelf

Until each feature exists, its lock must say **Paid direction — not built yet**.
A lock may not imply that payment immediately opens unfinished software.

### Hidden internal

- operator dashboards and document scoring
- matching-shadow controls and raw scoring
- SoleDash, TinkerDen, relay, and cockpit machinery
- provider configuration or environment state

## Smallest safe build after review

Turn `/dashboard/blueprints` into one honest Workshop shell backed only by the
member's existing profile narrative. Show the paid furniture in place as
clearly labeled concept previews, with no active upgrade action until the
feature and checkout truth are both verified.

## Hard stops preserved

No app edit, schema, SQL, production data, provider call, checkout change,
push, merge, deploy, or claim that unfinished paid furniture is available.
