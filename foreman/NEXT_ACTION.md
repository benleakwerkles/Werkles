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

1. Review local preview at http://localhost:3000 — homepage rewrite + auth surfaces coexist
2. Send Petra synthesis packet when ready → await `FROM_PETRA_WERKLES_HOMEPAGE_DISCOVERY_SYNTHESIS_*`
3. **Do not** Production deploy, Production env rollout, Stripe live, or push to `main` without explicit human gate

---

## Maker (Cursor) — active for integration verification

- Run `npm run typecheck` after merge commit
- **No** Production deploy, push to main, SQL, secrets, Ghost Forge spend
- Preserve homepage scope lock — no prod promotion

---

## Petra — pending

- `TO_PETRA_WERKLES_HOMEPAGE_DISCOVERY_SYNTHESIS_v1_20260606-135435.md` — unsent / unanswered
- Homepage merge to production: **NO-GO** until Petra GO + Ben gate

---

## Conditions (active)

- Gate 05 / Ghost Forge: **PAUSE**
- No Stripe **live** until separate live-mode gates
- No push / deploy / SQL / secrets from automation without explicit approval
- Crucible + live verification remain preview-blocked

---

## Gate 05 — PAUSE

| Metric | Value |
|--------|--------|
| Landed | 12/40 style variants |
| Status | **PAUSE** |
| Resume | Separate approval only |

---

## Hard stops

no Production deploy | no Production env rollout | no push to main | no SQL | no secrets | no Ghost Forge | no Stripe live | no live verification | no matching work
