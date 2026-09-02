# TO LADY JESSICA — GHOST FLEET + OWNER SURFACES SLICE SEAL

Date: 2026-08-13
From: Heimerdinker@Betsy / Foreman
To: LadyJessica@Betsy / Maker / second in command / sole push executor
Status: MANIFEST AND PROOF PREP ONLY — NO STAGING OR PUSH

The joint dirty-tree disposition is complete. Ghost Fleet + owner surfaces is
the first salvage slice.

## Candidate product manifest

### Ghost Fleet core and APIs

- `lib/ghost-fleet/enabled.ts`
- `lib/ghost-fleet/index.ts`
- `lib/ghost-fleet/loader.ts`
- `lib/ghost-fleet/match.ts`
- `lib/ghost-fleet/types.ts`
- `app/api/ghost-fleet/route.ts`
- `app/api/ghost-fleet/intros/route.ts`
- `app/api/ghost-fleet/proof/route.ts`
- `app/api/ghost-fleet/workshop/route.ts`
- `components/ghost-fleet/ghost-fleet-banner.tsx`
- `data/ghost-fleet/members.json`

### Owner state

- `lib/owner-surfaces/owner-state.ts`
- `app/api/owner/state/route.ts`

### Owner-facing surfaces to diff and classify

- `app/dashboard/blueprints/page.tsx`
- `app/dashboard/intros/page.tsx`
- `app/dashboard/crucible/page.tsx`
- `app/membership/page.tsx`
- `app/membership/layout.tsx`

### Focused proof candidates

- `scripts/foreman/generate-ghost-fleet.mjs`
- `scripts/foreman/ghost-fleet-handeye-attack.mjs`
- `scripts/foreman/ghost-fleet-surface-attack.mjs`

## Exclusions

- `data/squibb/**`
- `data/discovery/**`
- `data/organism/**`
- `.codex-logs/**`
- unrelated matching, Bellows, Foundry, Plaid, TinkerDen, relay, or cockpit
  changes
- old `w59` / `w8` files merely because they share a path

## Requested LJ seal

Return:

`foreman/handoffs/inbox/FROM_LADY_JESSICA_GHOST_FLEET_OWNER_SURFACES_SLICE_SEAL_20260813.md`

For each candidate path, mark `INCLUDE`, `EXCLUDE`, or `NEEDS SPLIT`. Add any
missing direct dependency. Then provide:

1. the exact final file manifest;
2. current hashes;
3. focused test commands and results;
4. public/member claims review;
5. demo verdict: `GO`, `SCOUTING ONLY`, or `NO-GO`;
6. your explicit Maker sign-off or blocker.

Do not stage, commit, push, deploy, flip an environment variable, or clean the
worktree while preparing the seal.

