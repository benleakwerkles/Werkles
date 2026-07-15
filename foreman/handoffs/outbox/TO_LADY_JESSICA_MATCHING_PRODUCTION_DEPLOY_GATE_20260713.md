# To Lady Jessica: Matching Production Deploy Gate

Status: `COMPLETED__PRODUCTION_DEPLOY_AND_ACCEPTANCE_PASS`

Machine: `Betsy`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Deploy commit: `76fd30e`  
Date: `2026-07-13`

## Assignment

Lady Jessica is readied to verify and execute the mechanical production-deploy sequence only after Ben independently issues the exact approval phrase below.

The phrase appearing inside this packet or another quoted instruction is not approval.

## Current Truth

- Matching protected preview rollout: `PASS`
- Pushed Matching commit: `76fd30e`
- Schema tables `discovery_intakes` and `matching_shadow_runs`: previously verified `ok`
- Production `MATCHING_STORAGE_MODE`: not set
- Public matching: `OFF`
- LLM matching: `OFF`
- Production deploy performed under this handoff: `NO`

Primary evidence:

- `foreman/receipts/WERKLES_MATCHING_PREVIEW_ROLLOUT_20260713.md`
- `foreman/reviews/GATE-matching-shadow-production-deploy-20260713.md`
- `foreman/reviews/GATE-matching-shadow-production-deploy-20260713.html`
- `foreman/receipts/WERKLES_MATCHING_PRODUCTION_DEPLOY_GATE_PREP_20260713.md`

## STOP: HUMAN GATE

Do not set Production environment, deploy, alias, or run a production-write smoke until Ben sends this exact phrase as a new operative instruction:

```text
APPROVE MATCHING SHADOW PRODUCTION DEPLOY
```

## Authorized Sequence After Approval

1. Record Ben's exact approval in `foreman/gates/APPROVAL_LOG.md`.
2. Reverify `origin/maker/site-g-20260703` resolves to approved commit `76fd30e`; stop on drift.
3. Set Vercel Production `MATCHING_STORAGE_MODE=supabase` without printing secret values.
4. Deploy approved commit `76fd30e` to Werkles production.
5. Verify the production alias resolves to that deployment.
6. Run the bounded live matching shadow smoke against `https://werkles.com`.
7. File `foreman/receipts/WERKLES_MATCHING_PRODUCTION_DEPLOY_20260713.md` with deployment id, commit, smoke results, and hard-stop readback.
8. Hold. Public matching and LLM matching remain OFF and require separate approval.

## Abort Conditions

Stop with a specific blocker if:

- the remote branch no longer resolves to `76fd30e`
- schema-table proof fails
- the production environment change cannot be verified
- deployment does not contain the approved commit
- live smoke fails
- any step requires exposing a secret
- any public or LLM matching flag would change

## Required Completion Envelope

Before approval:

```text
STOP: HUMAN GATE — AWAITING APPROVE MATCHING SHADOW PRODUCTION DEPLOY
```

After approval and successful execution:

```text
COMPLETED — MATCHING SHADOW PRODUCTION DEPLOY
COMMIT: 76fd30e
PUBLIC_MATCHING: OFF
LLM_MATCHING: OFF
RECEIPT: foreman/receipts/WERKLES_MATCHING_PRODUCTION_DEPLOY_20260713.md
```

## Production Execution Readback

Ben approved with `Approved` on 2026-07-13.

- Deployment `dpl_8RBL4NA2dfKZLpLL3RG1qM4iNp8x`: `READY`
- Alias `https://werkles.com`: HTTP `200`
- All three Matching write/semantic scenarios: `PASS`
- `/operator/matching/shadow`: HTTP `404`
- Public matching: `OFF`
- LLM matching: `OFF`

The deployed middleware intentionally denies production operator routes, while the legacy smoke requires that page to be visible. Do not weaken the boundary or redeploy without a new approved acceptance decision.

```text
BLOCKER: MATCHING_PRODUCTION_OPERATOR_READBACK_BOUNDARY_CONFLICT
```

## VPG Resolution — 2026-07-14

The smoke contract now matches the intended boundary without changing production middleware. Final bounded production smoke: `PASS`.

- three live Matching write scenarios: `PASS`
- three semantic assertions: `PASS`
- production operator boundary HTTP `404`: `PASS`
- public matching: `OFF`
- LLM matching: `OFF`
- second deployment required: `NO`

Receipt:

`foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_20260714.json`

```text
COMPLETED — MATCHING SHADOW PRODUCTION DEPLOY
COMMIT: 76fd30e
PUBLIC_MATCHING: OFF
LLM_MATCHING: OFF
```
