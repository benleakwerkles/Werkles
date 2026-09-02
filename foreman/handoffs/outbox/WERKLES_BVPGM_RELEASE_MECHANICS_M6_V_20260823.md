# Broad Vision — Release Mechanics M6

Date: 2026-08-23  
Foreman: Heimerdinker@Betsy  
Checkpoint: `REVIEW_RETURNS_CAN_FLOW_DIRECTLY_TO_EXACT_PUSH_GATE`

## Workstreams

1. **Candidate packaging:** prove the 278-file inventory can become one exact
   candidate-only commit without contaminating the real Git index.
2. **Deployment proof:** create a source-bound, read-only pre/post-promotion
   smoke runner and exact rollback verification plan.
3. **Gate completeness:** prepare the Tier 1 production push/deploy decision
   packet in a closed, not-yet-approvable state.
4. **CBCC rotation:** pull the exact terminal lanes again and attempt only
   materially different supported background routes; never assign transport to
   Ben or count packets as reviews.

## Fixed baseline

- Candidate digest:
  `e64ae1c67e7e065884781891a2139d8e699488b4bfdcceb2b4449e820b6c3386`
- Candidate files: 278
- Current production rollback deployment:
  `dpl_2u71JbztPiszxKuMRrCg4cG1Z6Ji`
- Terminal release receipts: 0/4
- Release keys: 0/3

## Allowed

- Local release tooling, tests, temp-index dry runs, read-only Vercel/live
  inspection, gate/report artifacts, existing-task route proof, receipt pull.

## Forbidden

- Touching the real Git index; commit, push, deploy, merge, production mutation,
  provider activation, login/OAuth, secrets, schema/RLS, spending, new task,
  environment, subagent, foreground input, or approval simulation.

## Acceptance

- Exact candidate path list and packaging dry-run pass without real-index drift.
- One repeatable live-smoke command covers member routes and internal 404s.
- Tier 1 gate packet names scope, risks, rollback, sign-offs, and phrases while
  remaining closed.
- Fresh CBCC/route state is reported honestly.

