# NEXT ACTION

**Effective gate:** `[IN PROGRESS: SALLY_RESCUE_MAIN_MERGE_INTEGRATION]`

---

## Integration status (2026-06-06)

`origin/main` @ `0c727a2` merged into `rescue/sally-dirty-worktree-2026-06-01` per `SALLY_MERGE_SAFETY_PROTOCOL`.

| Fact | Status |
|------|--------|
| APP_INFRA on main | Landed @ `0c727a2` |
| SUPABASE_AUTH_STRIPE Preview proof | **PASS** |
| Split preview gate model | Adopted from main |
| Homepage rewrite v1 | Preserved on rescue branch |
| Dispatch proofs | Preserved on rescue branch |
| Production rollout | **Still gated** |
| Stripe live / live verification | **Blocked** |
| Crucible | **Blocked** |

Snapshot: `foreman/reviews/SALLY_PRE_MERGE_SNAPSHOT_2026-06-06.md`

---

## Ben (Operator) — next hands

**Primary lane: build pages** — localhost preview (`npm run dev`, default 3000 or `PORT=3002`) is **unblocked**. Gate 05 PAUSE only stops Ghost Forge spend, not Maker page work.

1. **Build pages** — wire draft assets, narrative sections, lane tokens on localhost (no render wait required)
2. Review preview when ready — homepage rewrite + auth surfaces coexist
3. Send Petra synthesis packet when ready → await `FROM_PETRA_WERKLES_HOMEPAGE_DISCOVERY_SYNTHESIS_*`
4. **Do not** Production deploy, Production env rollout, Stripe live, or push to `main` without explicit human gate

**Ghost Forge hourly cap (429):** not an error, not a page blocker. Operator lift: `foreman/ghost-forge/OPERATOR_RATE_LIMIT.md` (`GHOST_FORGE_SKIP_RATE_LIMIT=1` on Render, then `-Force` on batch scripts). Agents must **not** auto-sleep 30+ minutes.

---

## Maker (Cursor) — active for integration verification

- Run `npm run typecheck` after merge commit
- **No** Production deploy, push to main, SQL, secrets, Ghost Forge spend
- Preserve homepage scope lock — no prod promotion
- **No** auto-queued render waits or 30+ minute sleeps on 429 — fail fast; Ben decides retry

---

## Petra — pending

- `TO_PETRA_WERKLES_HOMEPAGE_DISCOVERY_SYNTHESIS_v1_20260606-135435.md` — unsent / unanswered
- Homepage merge to production: **NO-GO** until Petra GO + Ben gate

---

## Conditions (active)

- Gate 05 / Ghost Forge: **PAUSE** — Render Batch 2 complete (9/9); no further spend without new GO. Hourly API cap is separate — see `foreman/ghost-forge/OPERATOR_RATE_LIMIT.md`
- No Stripe **live** until separate live-mode gates
- No push / deploy / SQL / secrets from automation without explicit approval
- Crucible + live verification remain preview-blocked

---

## Gate 05 - PAUSE (Render Batch 2 complete)

| Metric | Value |
|--------|--------|
| Batch 1 | `RESUME_GATE_05_LIMITED_RENDER` - 7/7 homepage narrative (~$1.40) |
| Batch 2 | `RENDER_BATCH_2_OPERATOR_GO` - 9/9 icons + Space D03 + Forge A04/A05 (~$1.80) |
| Results | `foreman/ghost-forge/RENDER_BATCH_2_RESULTS.md` |
| Status | **PAUSE** - no style variants or extra renders without new approval |

---
## Hard stops

no Production deploy | no Production env rollout | no push to main | no SQL | no secrets | no Ghost Forge | no Stripe live | no live verification | no matching work
