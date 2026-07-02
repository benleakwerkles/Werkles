# Operator Dashboard

- **Current phase:** Sally rescue branch — main integration complete; local lanes preserved
- **Current step:** Review merged branch; Petra homepage synthesis pending
- **Current risk level:** MEDIUM (production rollout still gated)
- **Effective gate:** `[IN PROGRESS: SALLY_RESCUE_MAIN_MERGE_INTEGRATION]`

## Main @ 0c727a2 (integrated)

| Check | Result |
|-------|--------|
| APP_INFRA surfaces | On main |
| Auth / First Weld | Preview PASS |
| Stripe test checkout + webhook | Preview PASS |
| Billing portal + cancel | Preview PASS |
| Crucible blocked | PASS |
| Split preview gates | Adopted |

**Production:** untouched — rollout is a **separate** human gate.

## Sally rescue lanes (preserved)

- Homepage rewrite v1 + stock preview + Ender visual tests
- Autonomous dispatch + homepage discovery proofs

## Preview gates

| Surface | Gate |
|---------|------|
| Login / signup / checkout / billing portal | Test wiring **enabled** |
| Crucible / live verification | **Blocked** |
| Stripe live / Production env | **Blocked** |

## Ben — next hands

1. Local walkthrough — http://localhost:3000
2. Petra homepage synthesis when ready
3. **Do not** change Production env or deploy Production without explicit rollout gate

## APPLY / PUSH / DEPLOY

**No** Production deploy · **No** Production env · **No** push to main without human gate

## Plain English

Main's auth/Stripe test wiring is now on the rescue branch alongside Sally's homepage and dispatch work. Preview proof passed on main. Production and live modes stay closed.

## Imagery doctrine

See `foreman/IMAGERY_DIRECTION.md`. Gate 05 spend still **PAUSE**.
