# WERKLES VPGM — BROAD ROTATION M6

Date: 2026-08-22 (America/New_York)  
Execution: `LOCAL_SALLY_WINDOWS`  
State: `MATCH_TO_SHARED_ACTION_LOOP_WALKED__FRESH_CBCC_REVIEW_OWED`

## V / P

Vision: `foreman/handoffs/outbox/HEIMERDINKER_V_WERKLES_BROAD_ROTATION_M6_20260822.md`  
Mission: `foreman/crew-dispatch/missions/WERKLES_BROAD_ROTATION_M6_20260822.json`

The rotation covered Match Deck, Formation, Personal Bellows, Workshop, and
Crucible. Fresh packets were issued for Petra, Skybro, Ender, Bean, and
Computer. Background dispatch timed out on Computer's CDP route. Final pull:
Petra/Skybro/Ender `CONNECT_FAILED`, Bean `NO_POSTED_LEG`, and Computer exposed
the same older Formation reply without a custody challenge. No fresh review is
claimed.

## G

1. Match Deck practice context now follows the selected profile into Formation
   and is shown only when the validated profile ID matches the room partner.
2. A mutual Formation statement can become a proposed First Shared Action with
   a voluntary owner, check-back date, and definition of done. It is versioned,
   validated, device-local, and invalidated when the accepted source changes.
3. Personal Bellows reopens the proposed action. Workshop preserves the chosen
   candidate when opening Formation. Crucible receives the action and asks for
   only the narrow claim that could change it; provider checks are not allowed
   to grade the person or partnership.

## M

The first rendered walk correctly failed because synthetic revision-1 wording
is excluded from the Operating Brief. That safety rule was preserved. The walk
then revised the statement, accepted revision 2 from both practice sides, built
the brief, saved a shared action, reopened it in Personal Bellows, and carried
it into Crucible. A second source contract protects the claim-first provider
handoff.

## Proof

- `npm run typecheck` — PASS.
- `npx tsx scripts/foreman/werkle-shared-action-continuity-smoke.ts` — PASS.
- `npx tsx scripts/foreman/werkle-formation-contract-smoke.ts` — PASS.
- `npx tsx scripts/foreman/match-deck-alignment-bridge-smoke.ts` — PASS.
- `node scripts/foreman/match-deck-shared-werkle-preview-smoke.mjs` — PASS.
- `node scripts/foreman/match-deck-to-crucible-claim-handoff-smoke.mjs` — PASS.
- Headless rendered walk across five product areas — PASS, clean console.
- React review: versioned/validated localStorage, stable effects, semantic
  labels, no new fetch/provider dependency, and responsive layouts.

No provider call, credentials, spend, SQL/schema/RLS, production mutation,
push, deploy, merge, new environment, Codex subagent, or foreground input.
