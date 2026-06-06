# Active Agent

## Effective gate

`[IN PROGRESS: SALLY_RESCUE_MAIN_MERGE_INTEGRATION]`

## Active writer

**Ben (Operator)** — review merged rescue branch locally. Production rollout remains a separate human gate.

**Maker (Cursor)** — integrate `origin/main` @ `0c727a2` into `rescue/sally-dirty-worktree-2026-06-01`. Homepage + dispatch lanes preserved.

**Petra (Comptroller)** — homepage synthesis handoff pending (`TO_PETRA_WERKLES_HOMEPAGE_DISCOVERY_SYNTHESIS_v1_*`). GATE_05 **PAUSE**.

**Codex** — cockpit sync on request.

## Deliverables on this branch

| Lane | Status |
|------|--------|
| APP_INFRA on main @ `0c727a2` | Merged into rescue branch |
| SUPABASE_AUTH_STRIPE Preview proof | **PASS** (recorded) |
| Homepage rewrite v1 | Local lane — preserved |
| Autonomous dispatch proofs | Local lane — preserved |

## Preview gates (split model — from main)

- **Auth / Stripe test wiring:** enabled (`AUTH_STRIPE_TEST_WIRING_ENABLED = true`)
- **Crucible / live verification:** blocked (`APP_INFRA_PREVIEW_CRUCIBLE = true`)
- **Production / live Stripe:** human gates — not opened

## Gate 05 / Ghost Forge

**PAUSE** — no image spend.

## Preview

- Local: http://localhost:3000
- Production: https://werkles.com — rollout **not** authorized by this merge

## Foreman

http://localhost:4317 — operator infra (accepted).
