# Broad Vision — Complete Werkles Push Report

Date: 2026-08-23  
Foreman: Heimerdinker@Betsy  
Checkpoint: `PRODUCTION_PUSH_DECISION_PACKET_COMPLETE`

## Broad workstreams

1. **Candidate integrity** — prove the exact source boundary, digest, import
   closure, focused contracts, TypeScript, and production build.
2. **Member journey** — prove the principal public/member routes and the current
   local-versus-live behavior delta.
3. **Trust and provider containment** — prove no unintended provider activation,
   secret inclusion, schema/RLS promotion, production mutation, or false custody
   claim entered the release candidate.
4. **Release custody and rollback** — separate machine readiness, actual CBCC
   review, three-key approval, push executor, deployment proof, and rollback.

## Fixed candidate

Digest at cycle start:
`e64ae1c67e7e065884781891a2139d8e699488b4bfdcceb2b4449e820b6c3386`

Any candidate-source drift invalidates the report and requires resealing.

## Actual CBCC lanes

- Ender: ordinary-human UX/copy release walk.
- Bean: trust/custody/provider hostile review.
- Skybro/Petra: value continuity and release judgment.
- Lady Jessica: independent exact-candidate craft/hash review and sole future
  push/deploy executor after all three keys.

Outgoing packets are not reviews. Route blockers remain blockers.

## Allowed work

- Read-only repo/live/deployment inspection.
- Existing configured local tests, typecheck, and production build.
- Local and production HTTP/browser proof without foreground input.
- Secret-pattern and boundary scans that never print secret values.
- Exact receipt pull and release-report authoring.

## Forbidden work

- Push, deploy, merge, production mutation, provider activation, login/OAuth,
  secret entry/readback, schema/RLS apply, spending, new task/environment/subagent,
  foreground input, or approval simulation.

## Acceptance

Return one report stating:

- exact payload and exclusions;
- fresh tests and route proof;
- live delta;
- trust/provider/security findings;
- CBCC receipt and three-key status;
- push executor and exact remaining gate;
- deployment verification and rollback plan;
- terminal verdict: READY_FOR_REVIEW, READY_FOR_APPROVAL, or BLOCKED.

