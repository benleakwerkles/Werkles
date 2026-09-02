# Tier 1 Gate — Ship Bellows intake closed-gate to production (without opening)

**Status:** `AWAITING HUMAN GATE`  
**Prepared:** 2026-07-25  
**Prepared by:** LadyJessica@Betsy  
**Lane:** Werkles.com / G  
**Related:** soft-live nested deploy `674f3db` left tip **without** closed-gate module

## Decision

Ship the local intake closed-submission boundary to werkles.com **while leaving submit closed** (no open env flags)?

This hardens soft live. It does **not** open public intake.

## Why

| Fact | Value |
|------|--------|
| Soft live nested pages | **200** on werkles.com |
| Tip `674f3db` has `concierge-intake-availability.ts` | **NO** |
| Local dirty tree has 503 close path | **YES** |
| Local proof script | `node scripts/foreman/test-bellows-intake-closed-gate.mjs` |

## Exact phrase

```text
APPROVE SHIP BELLOWS INTAKE CLOSED-GATE TO WERKLES.COM WITHOUT OPENING
```

## After approve (Dink / Maker)

1. Commit + push **only**:
   - `lib/squibb/concierge-intake-availability.ts`
   - `components/squibb/concierge-intake-form.tsx`
   - `app/api/bellows/intake/route.ts`
   - `.env.example`
   - `scripts/foreman/test-bellows-intake-closed-gate.mjs` (optional but recommended)
2. Clean-worktree Production deploy of that commit
3. Do **not** set `BELLOWS_INTAKE_SUBMISSION_OPEN=true`
4. Smoke: GET `/bellows/intake` 200; POST minimal fixture → **503**

Inventory: `foreman/handoffs/outbox/TO_HEIMERDINKER_INTAKE_BOUNDARY_SHIP_INVENTORY_20260725.md`

## Out of scope

- Opening submit (`APPROVE OPEN BELLOWS INTAKE SUBMISSION ON WERKLES.COM`)
- Live Stripe HG-4/HG-5
- VPG10 UI dump / unrelated dirty tree
- FCRA / LLM

## Reject / patch

```text
REJECT SHIP BELLOWS INTAKE CLOSED-GATE
PATCH SHIP BELLOWS INTAKE CLOSED-GATE: <instructions>
```
