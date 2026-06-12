# Operator Brief: GD Render Readiness Proof

**Mission:** `GD_RENDER_READINESS_PROOF_THEN_RENDER_COMMAND`  
**Generated:** 2026-06-01  
**Read this first.**

---

## 1. Executive summary (10-second read)

Narrative **custody is proven** for the GD four-beat arc (Spark → Space → Forge → Foundry) across mission class, cousin synthesis, scope lock, and partial homepage code — but **implementation is incomplete** (Space beat missing; Forge lives in visual-test preview; Petra homepage GO absent; Gate 05 PAUSE). **`RENDER_READY: NO`** for Ghost Forge spend today. **Verdict: CONDITIONAL GO** — preview-only Maker polish and queued render packet when Gate 05 opens.

---

## 2. Key findings

### Narrative custody proof (5 questions)

| Question | Answer |
|----------|--------|
| **1. Where does canonical arc live?** | Primary: `foreman/gd-intent-router/mission-classes.json` (`HOMEPAGE_VISUAL_NARRATIVE` visualBeats). Synthesis: `FROM_GD_SYNTHESIS_HOMEPAGE_VISUAL_NARRATIVE_GD_RUN_HOMEPAGE_VISUAL_NARRATIVE_20260606-173334.md`. Copy/scope: `foreman/WERKLES_HOMEPAGE_REWRITE_SCOPE_LOCK.md`, `lib/copy.ts`. Render plan: `RENDER_BATCH_ORDER.md`. New unified map: `MISSING_ARTIFACT_HOMEPAGE_NARRATIVE_ARC_CANONICAL_v1.md`. |
| **2. Handed to Ender?** | **Yes** — `TO_ENDER_GDINTENT_HOMEPAGE_VISUAL_NARRATIVE_v1_20260606-173334.md` + receipt collected; prior discovery `WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW` processed. |
| **3. Translated for Cursor/Maker?** | **Partial** — scope lock lists files; hero/trust rewrite landed in `hero-static.tsx`, `workshop-trust-rail.tsx`, `copy.ts`; beat sequence not fully wired in `app/page.tsx`; Ender Tests 1–3 at `#lanes`/`#formation` replace legacy `#people`. |
| **4. Reflected in homepage files?** | **Partial (~65%)** — beats 1, 3, 4, 6 present; beat 2/Forge partial; beat 5 partial via gallery; **Space beat absent**. |
| **5. Polish real arc or invent?** | Render would **mostly polish a real partial arc** if bound to existing artifacts — **risk of invention** on Space beat and if prompted with non-canonical “brutalist midnight” tone (conflicts with `SITE_STYLE_APPROVED_v0.6`). |

### Operator 6-beat vs GD 4-beat

The mission’s six-beat arc was **not** a single repo document before this proof. Mapping now lives in `MISSING_ARTIFACT_HOMEPAGE_NARRATIVE_ARC_CANONICAL_v1.md`.

### Blockers

- **Gate 05 / Ghost Forge: PAUSE** (`foreman/NEXT_ACTION.md`)
- **No `FROM_PETRA_WERKLES_HOMEPAGE_DISCOVERY_SYNTHESIS_*`** in inbox
- **Space render + section: missing**
- Tone brief in mission ≠ approved site style v0.6 (warm workshop wins)

---

## 3. Recommended next action

**Approve `MISSING_ARTIFACT_HOMEPAGE_NARRATIVE_ARC_CANONICAL_v1.md` as canonical**, then run **preview-only Maker pass** (section order + Space placeholder band) on a branch — **do not** invoke Ghost Forge until Gate 05 opens and you reply YES to four-beat structure from `OPERATOR_BRIEF_HOMEPAGE_VISUAL_NARRATIVE_*`.

---

## 4. Paste-ready prompt

```
MAKER — Homepage narrative continuity pass (PREVIEW ONLY)

Bind to:
- foreman/handoffs/outbox/MISSING_ARTIFACT_HOMEPAGE_NARRATIVE_ARC_CANONICAL_v1.md
- foreman/SITE_STYLE_APPROVED_v0.6.md
- lib/copy.ts (do not rewrite strategy)

Tasks:
1. Reorder homepage sections to match section map (Spark → Trust → Space placeholder → Lanes/Formation → How → Proof → Foundry gallery → Ops).
2. Add Space beat band (CSS plate or empty frame labeled "Space beat — asset pending") after WorkshopTrustRail.
3. Do NOT change auth, Stripe, Supabase, deploy config, or push to main.

Hard stops: production deploy, palette drift, new business claims.
Deliver: local preview URL + 1-paragraph beat-by-beat walkthrough.
```

---

## 5. Artifact paths

| Artifact | Path |
|----------|------|
| Narrative arc canonical (new) | `foreman/handoffs/outbox/MISSING_ARTIFACT_HOMEPAGE_NARRATIVE_ARC_CANONICAL_v1.md` |
| Render command (queued) | `foreman/handoffs/outbox/RENDER_COMMAND_PACKET_HOMEPAGE_QUEUED.md` |
| GD visual narrative synthesis | `foreman/handoffs/outbox/FROM_GD_SYNTHESIS_HOMEPAGE_VISUAL_NARRATIVE_GD_RUN_HOMEPAGE_VISUAL_NARRATIVE_20260606-173334.md` |
| Scope lock | `foreman/WERKLES_HOMEPAGE_REWRITE_SCOPE_LOCK.md` |
| Render batch order | `foreman/gd-intent-router/runs/GD_RUN_HOMEPAGE_VISUAL_NARRATIVE_20260606-173334/RENDER_BATCH_ORDER.md` |
| Homepage implementation | `app/page.tsx`, `components/foundry/hero-static.tsx`, `components/foundry/workshop-trust-rail.tsx` |
| Forge UI preview | `components/visual-system/ender-visual-tests-section.tsx` |

---

## Verdicts

| Field | Value |
|-------|-------|
| **Narrative custody** | **PROVEN** (4-beat GD; 6-beat mapped) |
| **RENDER_READY** | **NO** (Gate 05 + Space missing + Petra pending) |
| **Mission verdict** | **CONDITIONAL GO** |
