# Gate Review: Speaker Charter V1 — Autonomous Fact Delivery

**Gate type:** Tier 1 — Doctrine change  
**Status:** **CLOSED — REJECTED / SUPERSEDED (2026-07-15)**  
**Confidence:** HIGH  
**Date:** 2026-07-15  
**Prepared by:** Maker (Cursor)  
**Decision authority:** Ben (Operator)

Operator rejected the V1 framing: matching packaging is not Speaker. See `SPEAKER_CHARTER_V1_AUTONOMOUS_FACT_DELIVERY_DRAFT.md` (REJECTED) and `WERKLES_MEMBER_CAUSAL_SPEAKER_USE_V0.md`.

---

## What is being ratified

Speaker Charter V1 extends Speaker from an internal memory ledger (V0) into a **live fact-delivery surface** for the matching engine. It does **not** remove V0 — it adds a product-facing readout layer on top.

Draft artifact: `foreman/speaker/SPEAKER_CHARTER_V1_AUTONOMOUS_FACT_DELIVERY_DRAFT.md`

---

## What changes

| Dimension | V0 (current, ratified 2026-06-07) | V1 (proposed) |
|-----------|-----------------------------------|---------------|
| Speaker role | Internal causal memory ledger | Internal memory **+ live fact delivery** to member |
| Squibb role | Static demo voice | **Voice layer** wrapping ranked paths |
| Matching | Human operator reads intake | **Hybrid engine** (deterministic score + bounded LLM) |
| Recommendation | Human writes card | Engine produces card; **shadow review** then public flip |

---

## What does NOT change

- Speaker remains **advisory, not executive** — no hands, no deployments, no intros
- Speaker does not guarantee outcomes, trust, clearance, or partner quality
- Speaker does not override GD/Foreman dispatch
- Squibb does not invent facts absent from Speaker output
- Evidence strength labels are mandatory (verified / self_reported / inferred / missing)
- LLM assist is separately gated (`MATCHING_LLM_TRANSLATE_ENABLED`)
- Public flip is separately gated (`APPROVE MATCHING AUTONOMOUS GO-LIVE`)

---

## Confidence justification

- Shadow pipeline is deployed and passing in production (3/3 golden paths)
- Durable persistence (Supabase) is live
- All three feature flags (shadow, public, LLM) are independently controllable
- V1 explicitly preserves V0 constitutional limits
- The charter draft has been stable since 2026-07-08 with no requested patches

---

## Unknowns

- Whether the current three golden paths are sufficient coverage, or whether additional scenarios should be proven before public flip
- Whether Squibb voice quality is acceptable (LLM translation gated separately)
- Member perception of autonomous vs. human-written recommendations (tested after public flip, not before)

---

## Blast radius

**Low for ratification alone.** Ratifying V1 changes doctrine only — it does not flip any feature flag or alter any deployed code. The public flip and LLM enable remain separate human gates.

---

## Files changed

| File | Change |
|------|--------|
| `foreman/speaker/SPEAKER_CHARTER_V1_AUTONOMOUS_FACT_DELIVERY_DRAFT.md` | Status: DRAFT → RATIFIED |
| `foreman/gates/APPROVAL_LOG.md` | New entry recorded |
| `foreman/NEXT_ACTION.md` | Gate queue advances to public flip |

No product code changes. No deploy. No SQL. No secrets.

---

## Systems affected

- Doctrine only (cockpit files)
- No production code mutation
- No environment variable changes
- No database changes

---

## Budget / spend implications

None. Ratification is a doctrine operation with zero external cost.

---

## Lane status

G lane matching — shadow production deploy complete. Next serialized gate is this ratification.

---

## Known risks

1. **Doctrine scope creep** — ratifying V1 could be read as blanket approval for public matching. Mitigated: public flip is a separate, explicit human gate.
2. **Liability language drift** — V1 defines what Speaker may and may not claim. If product copy deviates, the charter is the controlling document. Mitigated: charter includes explicit "may claim" / "must not claim" lists.

---

## What remains blocked after ratification

| Gate | Status |
|------|--------|
| `APPROVE MATCHING AUTONOMOUS GO-LIVE` | Still blocked — public flip |
| `APPROVE MATCHING LLM TRANSLATE` | Still blocked — LLM slot |
| Retention/deletion automation | Still blocked — policy approved, automation gated |
| Stripe live checkout (HG-5) | Still blocked |
| FCRA / background checks | Policy-blocked |

---

## Approval phrases

**Approve:**
```text
RATIFY SPEAKER CHARTER V1 AUTONOMOUS FACT DELIVERY
```

**Reject:**
```text
REJECT SPEAKER CHARTER V1
```

**Patch:**
```text
PATCH SPEAKER CHARTER V1: <instructions>
```
