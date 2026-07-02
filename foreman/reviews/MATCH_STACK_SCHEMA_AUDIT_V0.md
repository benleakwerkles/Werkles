# Match Stack Schema Audit V0

**Date:** 2026-06-08  
**Doctrine:** `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`  
**Scope:** Read-only audit — no schema changes, no production data, no engine build.

---

## Executive summary

Today’s codebase has **partial Layer 1 (eligibility)** and **partial Layer 3 (compatibility scoring)** wired around **Blueprints** and **profiles**. **Layer 0 (need translation)** exists in **copy/narrative only** — not in schema or match RPC output. **Layers 2, 4, and 5** are **not represented** in production schema or app logic. Profile fields cover ~40% of Werkler Profile V0; proof is verification-status oriented, not lane-specific proof catalogs.

**Safe next build:** doctrine + explainable suggestion cards + Layer 0 **manual** translation UI (no ranker). **Not safe yet:** cohort builder, stable matching, anti-gaming model, hidden financial inference.

---

## 1. Profile fields today

### Supabase `profiles` (migrations `00001`, `00002`)

| Werkler V0 field | Represented? | Current column / surface |
|------------------|--------------|---------------------------|
| Lane | **Yes** | `lane` (`user_lane` enum: Builder, Operator, Backer, Connector, Spark) |
| Current Mission | **Partial** | `blueprint_narrative`, `primary_goal` — no dedicated mission field |
| Stated Need | **Partial** | `skills_sought[]` — skills not full need statements |
| Offer | **Partial** | `skills_offered[]` — no explicit “smallest useful action” |
| Proof | **Partial** | `id_status`, `funds_status`, `deep_audit_status` + badges view |
| Trust Gate | **No** | Not user-configurable per engagement |
| Momentum | **No** | No recent-actions feed |
| Preferred First Step | **No** | — |
| Availability / Capacity | **No** | — |
| Risk Tolerance | **No** | — |

**Also present (supporting):** `location_*`, `work_preference`, `industry_tags`, `timeline_to_launch`, `profile_depth`, `membership_tier`, `turf_zip`, `visibility_mode`, financial ranges via `user_financials`.

### App / mock surfaces

| Surface | Fields |
|---------|--------|
| `app/dashboard/profile/page.tsx` | display name, lane, location, skills offered/sought, industry tags, timeline, primary goal, turf, blueprint narrative, profile depth |
| `app/onboarding/page.tsx` | lane, arena, turf, first-weld path |
| `index.html` + `app.js` prototype | role, industry, city, radius, capital sliders, skills, goals, verified checkboxes |

**Gap:** No first-class **stated need** string, **offer** string, or **trust gate** preferences in schema or UI.

---

## 2. Proof fields today

### Production / preview

| Lane proof (doctrine) | Today |
|----------------------|--------|
| Identity | `id_status`, crucible identity check, badge category |
| Funds / capital band | `funds_status`, `user_financials` ranges, funds verification RPC |
| Work history | Crucible employment check (provider-pending in preview) |
| Licenses | Crucible license check (partial) |
| References | Crucible reference check (partial) |
| Lane-specific artifacts (builder prototype, operator P&L, etc.) | **Not modeled** — only generic proof categories |

### `verified_badges_view` / `proof_category`

Categories exist in SQL enum; public match RPC checks `Capital` badge and financial range overlap.

**Gap:** No per-lane proof checklist tied to match explanations. Proof doctrine in UI (`copy.proof.checks`) is **copy-only**.

---

## 3. Matching fields & logic today

### Production path

- **API:** `app/api/matches/route.ts` → RPC `match_candidates_for_blueprint`
- **SQL:** `supabase/migrations/00001_initial_schema.sql` — weighted score from:
  - lane pair bonuses (Layer 3 partial)
  - distance / work preference (Layer 1 partial)
  - skill overlap (`skills_sought` ∩ `skills_offered`)
  - industry tag overlap
  - timeline / primary_goal alignment
  - capital range overlap + verified capital badge
  - block list exclusion (Layer 1)
- **Output:** `score`, `factors` jsonb — explainable factors exist but **not** need-translation narrative

### Mock path

- **`app.js` / `public/app.js`:** `scoreProfile()` — complementary roles, capital paths, skill overlap, proof count; outputs **reason strings** (recently updated to potential/runway language)

### Blueprint-centric model

Matching is organized around **Blueprint rooms** (multi-member), aligned with `company/WERKLES_MATCHING_RULES.md` Article VII multi-member pattern.

**Gap:** Match output still person-centric (“candidate may cover your capital gap”) not structure-centric (“the nearer bottleneck may be customer validation”).

---

## 4. Recovered layers — representation matrix

| Layer | Name | Represented? | Where / notes |
|-------|------|--------------|---------------|
| **0** | Need translation | **Narrative only** | Home Reveal copy, `copy.home.reveal.pairs`, Squibb hints — **no engine** |
| **1** | Eligibility | **Partial** | blocks, account_status, distance cap, lane enum, membership gates |
| **2** | Anti-gaming | **No** | No throttle signals in schema |
| **3** | Compatibility scorer | **Partial** | Blueprint RPC + mock `scoreProfile` |
| **4** | Two-sided preference | **Partial** | Intro request flow exists; no stable matching algorithm |
| **5** | Cohort / crew builder | **No** | Blueprint multi-seat concept only; no crew-level scoring |

---

## 5. What Layer 0 would require (no schema risk)

| Requirement | Type | Risk |
|-------------|------|------|
| Stated need capture (free text + presets) | UI + optional JSON column | LOW if mock/local only |
| Translation templates (thought → reveal pairs) | Copy + rules engine (manual) | LOW |
| Squibb / Aeye surfacing options | UI copy + checklist | LOW |
| Reality check inputs | Read existing profile + proof status | LOW — read-only |
| Persisted translated need | New column or workshop artifact | MEDIUM — needs migration gate |
| LLM need translation | Provider call | **GATED** — provider + counsel |

**V0 without migration:** Layer 0 as **onboarding question + home reveal cards + match card footnotes** using existing fields.

---

## 6. What Layer 5 would require later

| Requirement | Dependency |
|-------------|------------|
| Crew entity or Blueprint seat model with roles | Schema + RLS |
| Complementarity graph (redundancy, missing roles) | Engine + live data |
| Group viability score | Paying-stranger signal per doctrine |
| Walkout / formation UX | Ender art direction + imagery (pending) |

**Explicitly deferred** until paying-stranger signal and Petra GO.

---

## 7. What v0 can ship without production data

- Doctrine docs (this audit + `WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`) ✅
- Explainable match reasons on cards (extend `factors` display) — UI only
- Stated need + offer fields in **local preview** / onboarding copy
- Layer 0 **static** translation pairs on home and workbench
- Manual “next path” suggestions (capital efficiency, customer validation) as copy templates
- Imagery arc for “missing piece” vs “three partners” — **blocked on Ender art direction + Gate 05 Render GO**

---

## 8. What v0 must not ship yet

- Learned ranker
- Complex anti-gaming
- Stable matching / mutual assignment solver
- Automatic cohort builder
- Hidden financial inference
- Guaranteed match claims
- Schema migrations for trust gates / momentum without human gate

---

## 9. Terminology drift watch

| Doctrine | Codebase today |
|----------|----------------|
| Worker lane | **Spark** (+ Builder for hands-on) |
| “Fit” / compatibility frame | Migrating to **potential** / **runway** in copy |
| “Matching algorithm” | **Formation architecture** — do not market as algo |

---

## 10. Recommended next slices (ordered)

1. **Ben + Ender:** art direction for imagery arc — *what you didn't know you needed* (not three-partner join-up poster). Gate 05 Render GO required for new shots.
2. **Maker:** Layer 0 UI mock — stated need + translated need cards on workbench (no SQL).
3. **Maker:** Match deck shows `factors` + doctrine-style “next path” footnote (read RPC jsonb).
4. **Petra:** GO/NO-GO on any profile schema extension for stated need / offer / trust gate.
5. **Post-signal:** Layer 5 Blueprint seat modeling.

---

## Checks performed

Read-only scan of: `supabase/migrations/`, `app/api/matches/`, `app/dashboard/profile/`, `app.js`, `lib/copy.ts`, `company/WERKLES_MATCHING_RULES.md`.

No migrations applied. No engine code written.
