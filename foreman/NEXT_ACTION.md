# NEXT ACTION

**Effective gate:** `[AWAITING HUMAN GATE: APPROVE_MATCHING_AUTONOMOUS_GO_LIVE]`

Updated: 2026-07-16

---

## G lane — Matching (active)

Branch: `maker/site-g-20260703` @ `176a586` (production redeploy receipt)

### Completed

| Milestone | Evidence |
|-----------|----------|
| Shadow + durable production | `WERKLES_MATCHING_PRODUCTION_DEPLOY_20260713.md` |
| Matching readout rename redeploy | `WERKLES_MATCHING_READOUT_REDEPLOY_20260716.md` · `a2c5a6c` · smoke PASS |
| Speaker V1 rejected; member causal drafts | `WERKLES_MEMBER_CAUSAL_SPEAKER_USE_V0.md` |

### Current flags (production)

| Flag | Value |
|------|-------|
| `MATCHING_AUTONOMOUS_SHADOW` | `true` |
| `MATCHING_AUTONOMOUS_PUBLIC` | `false` — **OFF** |
| `MATCHING_LLM_TRANSLATE_ENABLED` | `false` — **OFF** |
| `MATCHING_STORAGE_MODE` | `supabase` |

### Next gates

1. **`APPROVE MATCHING AUTONOMOUS GO-LIVE`** ← current (Tier 1)
   - Review: `foreman/reviews/GATE-matching-autonomous-go-live-20260716.html`
   - Confidence: **MEDIUM** (export/deletion UX not built; 3 golden paths only)
2. `APPROVE MATCHING LLM TRANSLATE` — optional
3. Retention/deletion automation — policy approved; job gated

---

## Ben (Operator) — next hands

Open the go-live gate dashboard and decide:

- `APPROVE MATCHING AUTONOMOUS GO-LIVE`
- `APPROVE MATCHING AUTONOMOUS GO-LIVE WITH CONDITIONS: …`
- `REJECT MATCHING AUTONOMOUS GO-LIVE`
- `PATCH MATCHING AUTONOMOUS GO-LIVE: …`

Mechanical prep done: stale “Speaker facts” intake copy patched locally (uncommitted) to Matching readout wording. Flag still `false`.

---

## Hard stops

no public matching flip without phrase above | no LLM enable | no push to main | no SQL without approval | no secrets | no Ghost Forge spend | no Stripe live
