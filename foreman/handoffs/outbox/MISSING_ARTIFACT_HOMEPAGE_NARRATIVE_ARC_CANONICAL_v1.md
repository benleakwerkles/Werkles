# Homepage Narrative Arc — Canonical v1

Status: **DRAFT CANONICAL** — closes custody gap found by `GD_RENDER_READINESS_PROOF_20260601`  
Authority chain: Operator 6-beat intent → GD 4 visual beats → homepage section map

---

## Operator narrative arc (6 beats)

| # | Beat | Job on homepage |
|---|------|-----------------|
| 1 | Operator frustration / broken trust economy | Self-select via named before-state; reject guru fog |
| 2 | Discovery of real Builders, Backers, Connectors, Operators, Sparks | Show lanes as roles, not costumes |
| 3 | Verification and trust infrastructure | Proof posture, crucible preview, no magic trust |
| 4 | Practical collaboration, not guru fantasy | Fit test + knock; visible reasons |
| 5 | Mythic industrial optimism | Workshop/foundry voice — steel under dream logic |
| 6 | Clear action: join / build / verify / match | Primary CTA + signup preview |

---

## GD visual beats (4 beats — repo canonical)

Source: `foreman/gd-intent-router/mission-classes.json` · synthesis `GD_RUN_HOMEPAGE_VISUAL_NARRATIVE_20260606-173334`

| Visual beat | Operator beats served |
|-------------|----------------------|
| **Spark** | 1 (frustration/intimacy), partial 5 |
| **Space** | 1→2 transition (latent capacity) |
| **Forge** | 2 (lanes/assembly), 4 (collaboration) |
| **Foundry** | 3 (proof), 5 (outcomes), partial 6 |

---

## Homepage section map (target)

| Scroll order | Section / component | Beat(s) | Status (2026-06-01 proof) |
|--------------|---------------------|---------|---------------------------|
| 1 | `HeroStatic` + Spark imagery | Spark · 1 · 6 | **IMPLEMENTED** — headline, beforeState, artifact, CTAs |
| 2 | `WorkshopTrustRail` | 1 · 3 · 6 | **IMPLEMENTED** — before / proof / signup preview |
| 3 | **Space still** (new band — one environmental photo) | Space | **MISSING** — no asset, no section |
| 4 | `EnderVisualTestsSection` → `#lanes` + `#formation` | Forge · 2 · 4 | **PARTIAL** — preview lane, not narrative-sequenced |
| 5 | `#how` (`copy.howItWorks`) | 4 · 3 | **IMPLEMENTED** |
| 6 | Proof band (`copy.trust`) | 3 | **IMPLEMENTED** |
| 7 | `RenderBatch1Gallery` | Foundry · 5 | **IMPLEMENTED** — draft preview gallery |
| 8 | Ops grid (beta + proof stack + deck teaser) | 3 · 6 | **IMPLEMENTED** |

---

## Tone lock (Render / Maker)

**Canonical:** `foreman/SITE_STYLE_APPROVED_v0.6.md` + `foreman/ghost-forge/WERKLES_RENDER_BATCH_1.md`  
**Not canonical without Ben override:** “brutalist midnight fortress” palette from ad-hoc mission brief — conflicts with approved warm workshop v0.6.

Industrial-chic metallurgy is expressed via Iron Palette UI (`app/visual-system.css`), copper kickers, and documentary Foundry imagery — not a full dark-mode pivot.

---

## Render custody

| Asset class | Plan | Gate |
|-------------|------|------|
| Spark hero | Batch 1 `spark-kitchen-table` | Delivered (local preview) |
| Space environmental | RENDER_BATCH_ORDER #2 | **Not rendered** |
| Forge scenes | Batch 1 + formation UI | Partial |
| Foundry gallery | Batch 1 roster | Delivered (local preview) |

---

## Definition of done (narrative arc)

- [ ] Space beat: one render + one homepage placement between trust rail and lanes
- [ ] Forge beat: lanes/formation promoted from visual-test preview to narrative section (or labeled as canonical Forge beat)
- [ ] Six-beat copy audit: each beat has exactly one primary section (no beat competes in hero fold)
- [ ] Petra `FROM_PETRA_*` homepage GO on file
- [ ] Gate 05 lifted before Ghost Forge spend on Space + new Foundry scenes
