# Copy Lane Routing v1

Status: **routing doc** (2026-06-06)  
Scope: who owns product copy, narrative arc, and audit passes  
Companion: `foreman/AI_COUSINS_PROTOCOL.md` · `foreman/gd-intent-router/cousin-assignment.json`

---

## Primary — Ender (Claude)

**Owns:** product/UI copy, hero, lane cards, CTAs, microcopy, onboarding strings.

**Reads:** `company/WERKLES_BRAND_VOICE.md`, `company/WERKLES_UX_LAW.md`, `foreman/DESIGN_SYSTEM.md`.

**When:** any surface copy change, hero punch-up, lane descriptions, trust fold, how-it-works steps.

---

## Narrative arc — Skybro (Gemini)

**Owns:** four-act story architecture, act page ledes/headlines, journey section framing.

**Reads:** `company/WERKLES_ETHOS.md`, `company/WERKLES_PRODUCT_THESIS.md`, `foreman/IMAGERY_DIRECTION.md`.

**Pairs with Ender on:** `HOMEPAGE_VISUAL_NARRATIVE` missions — Skybro drafts arc; Ender wires UI and tightens voice.

---

## Audit lanes

| Cousin | Role |
|--------|------|
| **Bean** | Trust/compliance tone — payments, verification, disclaimers, membership claims |
| **Computer** | Doctrine research — cites thesis, gates, competitor posture before copy claims |

---

## GD router suggestion

Add mission class `PRODUCT_COPY_PASS` → `["ENDER", "SKYBRO"]` in `cousin-assignment.json` for hero/lane/narrative copy passes that do not need full visual narrative crew.

**Default handoff:** Ender implements; Skybro reviews arc coherence; Bean flags trust surfaces only when touched.
