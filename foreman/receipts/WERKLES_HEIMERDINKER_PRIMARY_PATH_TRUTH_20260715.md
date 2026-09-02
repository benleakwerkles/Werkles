# Werkles Heimerdinker Primary Path Truth Receipt

Status: `COMPLETED`  
Packet: `foreman/handoffs/outbox/TO_HEIMERDINKER_WERKLES_COM_PRIMARY_PATH_TRUTH_VPG_20260715.md`  
Execution authority: Ben (Operator)  
Executed locally by: Codex Foreman / Heimerdinker on Betsy  
Date: 2026-07-15

## Implemented

Both visible `Tell us what you need` actions now open the existing public Werkles intake at `/bellows/intake`:

- homepage hero
- site header

Signup, login, dues, proof, and member routes remain intact elsewhere.

## Files

- `components/foundry/hero-static.tsx`
- `components/foundry/site-header.tsx`

## Proof

- visible `Tell us what you need` links: 2
- links resolving to `/bellows/intake`: 2
- intake heading `Name what you are carrying`: exactly 1
- intake form: present
- browser errors/warnings: 0
- `npm.cmd run typecheck`: PASS
- scoped `git diff --check`: PASS

## Boundaries

No auth rewrite, new funnel, tracking system, dependency, deploy, push, merge, SQL, secret, production mutation, feature-flag change, Harvey/ThinkIt work, or remote-machine action.
