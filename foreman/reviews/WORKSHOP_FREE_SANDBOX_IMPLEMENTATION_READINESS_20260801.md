# Free Workshop — smallest implementation slice after review

Date: 2026-08-01
Seat: Codex Foreman / Dink @ Betsy
Status: **DRAFT READINESS — DO NOT BUILD YET**

## Start conditions

All three must be true before product code begins:

1. Ben gives the local first mock a Tier 2 direction: keep, patch, or reject.
2. The actual Ender and Demo seats return their review packets.
3. A dated Vision/implementation packet declares the local product lane,
   allowed files, limit, and stop condition.

No payment, schema, provider, push, merge, or deployment approval is bundled
into that local build decision.

## Smallest useful slice

Turn `/dashboard/blueprints` from an orientation card into one authenticated
Workshop shell that reuses the member's existing profile data.

### Free behavior

- show one Workshop room
- load the member's lane, location, primary goal, and `blueprint_narrative`
- let the member update only `blueprint_narrative` through the same own-profile
  permissions already used by onboarding/profile
- shape that narrative into three visible areas: what I know, what needs a
  decision, and next useful move
- link back to profile and Bellows without implying that Bellows output has
  already been imported

### Visible but inert direction

- People bench
- Shared documents
- Whiteboard
- Guarded intro
- Provider checks

Each remains non-interactive and says `Direction — not built yet` until its
own implementation and truth checks exist. Do not attach an upgrade button to
unfinished furniture.

## Proposed local file boundary

- `app/dashboard/blueprints/page.tsx`
- new `app/dashboard/blueprints/workshop-sandbox-client.tsx`
- scoped Workshop selectors appended to `app/globals.css`
- new `scripts/foreman/test-free-workshop-first-slice.mjs`
- one dated Vision card and one receipt

No other app, API, migration, provider, payment, matching, or operator file.

## Required implementation safeguards

1. Wrap the route with `DashboardAuthGuard next="/dashboard/blueprints"`
   before loading member data.
2. Query only the signed-in user's own profile row.
3. Save only `blueprint_narrative`; do not expose or mutate server-owned
   membership, verification, account-status, or trust fields.
4. Do not query raw matching scores or internal operator records.
5. Missing profile/narrative states must still produce a useful empty room,
   not a dead end or provider-configuration message.

## Acceptance proof

- unauthenticated route redirects to login
- authenticated free preview renders the room
- blank narrative and populated narrative both render
- only the narrative field is writable
- paid-direction furniture performs no action and makes no availability claim
- keyboard order follows rail → decision board → free artifact → paid direction
- 390, 720, 980, and 1440px: no horizontal overflow
- typecheck, production build, focused source-truth test, and headless route QA
- no new schema, environment, paid call, or production write

## Stop condition

Stop after a local, review-only implementation and proof receipt. Any push,
deploy, checkout behavior, live provider action, schema change, or promotion
remains a separate human gate.
