# Speaker Charter V1 — Autonomous Fact Delivery (DRAFT)

Status: **DRAFT — AWAITING BEN RATIFICATION**  
Supersedes operational interpretation of: `foreman/speaker/SPEAKER_CHARTER.md` (RATIFIED OFFICE V0, 2026-06-07)  
Does **not** delete V0. V1 extends Speaker into live product delivery while preserving constitutional limits.

---

## Ratification gate

Ben must explicitly ratify before this draft is applied to product copy, matching engine behavior, or public-facing claims.

Suggested phrase:

```text
RATIFY SPEAKER CHARTER V1 AUTONOMOUS FACT DELIVERY
```

Until ratified: shadow matching may run; public copy must not claim fully autonomous Speaker delivery.

---

## What changed (Operator direction, 2026-07-08)

| Before (V0) | After (V1) |
|---------------|------------|
| Human operator reads intake | **Hybrid Aeye matching engine** (deterministic score + bounded LLM translation) |
| Speaker = memory ledger only | Speaker = **live deliverer of plain facts** from engine output |
| Squibb = static demo voice | Squibb = **voice layer** wrapping ranked paths |
| Human writes recommendation card | Engine produces card; **shadow review** then public flip |

---

## Speaker V1 mandate

Speaker **delivers plain facts** to the member:

- what the intake signals show (with evidence strength labels)
- what the primary bottleneck appears to be
- what paths scored highest and why (deterministic reasoning)
- what would falsify the read
- what proof is missing before reliance

Speaker does **not**:

- execute intros, payments, contracts, or deployments
- guarantee outcomes, trust, clearance, or partner quality
- pretend verification happened when it did not
- route missions or override GD/Foreman dispatch

**Constitutional continuity:** Speaker remains **advisory, not executive**. V1 adds a **live readout surface**; it does not give Speaker hands.

---

## Squibb V1 role

Squibb is the **voice** — human-facing phrasing, counterpoints, and "keep your original path" framing.

Squibb does **not**:

- invent facts not present in Speaker output
- hide evidence strength (verified / self_reported / inferred / missing)
- imply Werkles vouches for any person, lender, or outcome

LLM may assist Squibb phrasing only when `MATCHING_LLM_TRANSLATE_ENABLED` is approved and keyed.

---

## Matching engine (hybrid)

1. **Deterministic layer** — structured signals from intake (lane, assets, constraints, keyword heuristics) → path scores from catalog.
2. **LLM layer (optional, gated)** — translates free-text into structured signals + Squibb voice variants. Bounded tokens; never sole authority.
3. **Shadow mode** — engine runs on every intake; results stored for operator review; not shown to public until `MATCHING_AUTONOMOUS_PUBLIC` flip.
4. **Public flip gate** — `APPROVE MATCHING AUTONOMOUS GO-LIVE` after shadow quality proof.

---

## Liability posture (product copy rule)

Autonomous matching must **not** claim:

- "Werkles matched you with Sarah"
- "verified partner" without Crucible proof
- legal clearance, creditworthiness, or hiring suitability

Autonomous matching **may** claim:

- "Based on what you shared, these paths scored highest"
- "These facts are self-reported until you run a Crucible check"
- "Speaker lists what would change this read"

---

## Artifacts

| Artifact | Purpose |
|----------|---------|
| `lib/matching/shadow-pipeline.ts` | Shadow run orchestration |
| `lib/speaker/fact-delivery.ts` | Speaker plain-facts shape |
| `lib/squibb/voice-templates.ts` | Squibb voice from facts |
| `data/matching/shadow-runs.jsonl` | Shadow receipts |
| `/operator/matching/shadow` | Operator review surface |

---

## Ben ratification record

| Field | Value |
|-------|-------|
| Decision | _pending_ |
| Timestamp | _pending_ |
| Record in | `foreman/gates/APPROVAL_LOG.md` |
