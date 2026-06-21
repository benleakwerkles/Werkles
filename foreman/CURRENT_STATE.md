# Current State

Status: synced 2026-06-06 (`SALLY_MERGE_SAFETY_PROTOCOL` — main merged into rescue branch)

## Effective gate

`[IN PROGRESS: SALLY_RESCUE_MAIN_MERGE_INTEGRATION]`

## Main integration

- **APP_INFRA** landed on `origin/main` @ `0c727a2`
- **SUPABASE_AUTH_STRIPE_TEST_WIRING** Preview proof: **PASS** (2026-06-01) — `foreman/gates/APPROVAL_LOG.md`
- **Split preview gates:** auth/Stripe test wiring enabled; crucible blocked; live Stripe/live verification blocked
- **Production rollout:** still gated — no Production env changes from this merge

### Preview proof summary (main)

| Step | Result |
|------|--------|
| Auth signup/login/confirm | PASS |
| First Weld / profile | PASS |
| Stripe test checkout | PASS |
| Webhook → membership | PASS |
| Billing portal | PASS |
| Cancel → revoke | PASS |
| Crucible blocked | PASS |

## Sally rescue lane work (local branch)

| Lane | Artifacts |
|------|-----------|
| Homepage rewrite v1 | `foreman/WERKLES_HOMEPAGE_REWRITE_SCOPE_LOCK.md`, hero/trust rail, visual-system, stock preview |
| Dispatch | Autonomous round-trip proofs, homepage discovery full crew, Petra handoff packet |
| Imagery doctrine | `foreman/IMAGERY_DIRECTION.md`, Ender visual tests review |

**Petra homepage synthesis:** `TO_PETRA_WERKLES_HOMEPAGE_DISCOVERY_SYNTHESIS_v1_*` — prepared, not yet answered.

## APP_INFRA-01 (closed)

- **Ben verdict:** **APPROVE** (2026-06-03) — `foreman/gates/APPROVAL_LOG.md`

## Ghost Forge / Gate 05

**PAUSE** — separate budget/render gate before image spend resumes.

## Hard stops

no Production deploy | no Production env rollout | no push to main without human gate | no SQL | no secrets | no Ghost Forge spend | no Stripe live | no live verification
