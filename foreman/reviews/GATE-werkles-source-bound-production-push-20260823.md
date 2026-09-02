# Tier 1 Gate — Werkles Source-Bound Production Push

Status: `DRAFT_CLOSED__EXACT_REVIEWS_AND_FIRST_TWO_KEYS_OWED`  
Confidence: `HIGH` on machine proof; `LOW` on release authorization until actual reviews return

## Decision eventually presented

Push and blue/green deploy the exact candidate-only commit to `werkles.com`?

This gate is **not open yet**. Do not use an approval phrase until the packet is
updated with the candidate commit SHA, terminal CBCC receipts, Heimerdinker
sign-off, and Lady Jessica sign-off.

## Candidate

- Digest:
`c8e9e755e4ec320c9e781ef272fef29dd6dd6feb556a93f3c702ee2d1cac8ece`
- Inventory paths: 282
- Changed commit payload paths: 274
- Baseline-bound dependencies: 8
- Candidate commit SHA: `NOT_CREATED`

## Confidence justification

- 34/34 contracts, TypeScript, production build, 10/10 local member routes,
  and 20/20 desktop/mobile rendered acceptance checks pass.
- Temp-index packaging proves zero noncandidate contamination and no real-index mutation.
- Current production and rollback deployment are authenticated through Vercel.
- Confidence cannot become HIGH for release until independent reviewers inspect
  the exact candidate/commit and return terminal judgments.

## Unknowns

- Ender, Bean, Skybro/Petra, and Lady Jessica terminal judgments.
- Whether review names PATCH work that changes the candidate digest.
- Exact future candidate-only commit SHA and candidate deployment URL.
- Exact runtime behavior on the future deployment before alias promotion.

## Blast radius

- Replaces the public/member Werkles application on `werkles.com`.
- Adds Formation and Personal Bellows routes currently absent from production.
- Updates Home, Login, Intake, Recommendations, Workshop, Match Deck, Crucible,
  and Membership behavior and presentation.
- Does not approve provider activation, live payment, schema/RLS, production
  data mutation, LLM advice, or account-durable Intake.

## Files changed

Exact inventory:
`foreman/releases/WERKLES_BVPGM_RELEASE_CANDIDATE_INVENTORY_20260823.json`

No commit exists yet. The future push must contain only the 274 changed payload
paths proved by the temp-index dry run and retain the eight baseline dependencies.

## Systems affected

- Git remote branch `maker/site-g-20260703`
- Vercel project `werkles/werkles1`
- Public alias `werkles.com`
- Read-only public/member routes named in the release smoke

## Budget and spend

$0 incremental provider spend. Existing Vercel hosting only. No paid provider
call is part of the release.

## Lane status

Machine proof: complete. Independent review: blocked. Three-key custody: 0/3.
Lady Jessica remains the sole push/deploy executor.

## Known risks

- Full build evidence comes from the shared dirty tree, not a new isolated
  worktree, because new environments are prohibited.
- Intake is not account-durable without the separately blocked schema/RLS work.
- Browser-local artifacts remain browser-local.
- A candidate-only commit assembled incorrectly could include unrelated dirty
  work; the temp-index proof and digest reseal are mandatory.

## Deployment and rollback

1. Build a candidate deployment without assigning the public alias.
2. Run `werkles-production-release-smoke.mjs` against that URL with internal
   mode blocked.
3. Promote only after the candidate smoke passes.
4. Re-run smoke against `werkles.com`.
5. On failure, rollback to Ready deployment
   `dpl_2u71JbztPiszxKuMRrCg4cG1Z6Ji` at
   `https://werkles1-euxo6w8xy-werkles.vercel.app`.

## What remains blocked

- Any push, deploy, alias promotion, or rollback execution.
- Candidate commit creation until review assimilation is complete.
- Provider activation, secrets, payments, schema/RLS, and production data.

## Future phrases — inactive today

Approval:

```text
APPROVE WERKLES SOURCE-BOUND PUSH AND BLUE-GREEN DEPLOY: <exact commit SHA>
```

Patch:

```text
PATCH WERKLES SOURCE-BOUND PUSH: <instructions>
```

Reject:

```text
REJECT WERKLES SOURCE-BOUND PUSH
```

The approval phrase becomes valid only after this packet names all terminal
review receipts and the first two keys for the same exact commit.
