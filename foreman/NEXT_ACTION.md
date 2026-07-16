# NEXT ACTION

**Effective gate:** `[AWAITING HUMAN GATE: APPROVE_MATCHING_AUTONOMOUS_GO_LIVE]` (not yet prepared — next after rename lands)

Updated: 2026-07-15

---

## G lane — Matching (active)

### Completed

| Milestone | Receipt / note | Date |
|-----------|----------------|------|
| Matching shadow production deploy + acceptance | `foreman/receipts/WERKLES_MATCHING_PRODUCTION_DEPLOY_20260713.md` | 2026-07-13/14 |
| Speaker Charter V1 **rejected** (misnamed packaging) | Operator direction; draft marked REJECTED | 2026-07-15 |
| Matching packaging renamed → **Matching readout** | `lib/matching` (`MatchingReadout`, `buildMatchingReadout`) | 2026-07-15 |
| Real Speaker use case (member causal drafts) | `foreman/speaker/WERKLES_MEMBER_CAUSAL_SPEAKER_USE_V0.md` | 2026-07-15 |

### Current flags (production)

| Flag | Value |
|------|-------|
| `MATCHING_AUTONOMOUS_SHADOW` | `true` |
| `MATCHING_AUTONOMOUS_PUBLIC` | `false` — **OFF** |
| `MATCHING_LLM_TRANSLATE_ENABLED` | `false` — **OFF** |
| `MATCHING_STORAGE_MODE` | `supabase` |

### Naming (do not regress)

| Term | Meaning |
|------|---------|
| **Matching readout** | One-shot facts/card/paths for a run |
| **Speaker** | Causal memory office (Harvey/Nerdkle); member journey drafts allowed |
| **Squibb** | Voice wrapping the readout |

### Next gates (serialized)

1. Prep + present `APPROVE MATCHING AUTONOMOUS GO-LIVE` (public flip) — Tier 1
2. `APPROVE MATCHING LLM TRANSLATE` — optional
3. Retention/deletion automation — policy approved, automation gated

`RATIFY SPEAKER CHARTER V1` is **void** — do not present.

---

## Ben (Operator) — next hands

None required for the rename. When ready for public matching: await Tier 1 go-live gate packet.

---

## Hard stops

no push to main | no SQL without approval | no secrets | no Ghost Forge spend | no Stripe live | no public matching flip | no LLM matching enable | no renaming Matching readout back to Speaker
