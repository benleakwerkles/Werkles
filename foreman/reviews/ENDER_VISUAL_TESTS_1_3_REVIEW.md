# Ender Visual Tests 1–3 — Review Packet

**Gate:** `[AWAITING HUMAN GATE: ENDER_VISUAL_TESTS_1_3_REVIEW]`  
**Authority:** `FROM_ENDER_VISUAL_DIRECTION_LOCK_v1.md`  
**Petra verdict:** GO WITH CONDITIONS  
**Implementation date:** 2026-05-31  
**Scope:** UI-only Tests 1–3 — profile cards, lane cards, formation sequence

**Hard stops observed:** No Ghost Forge · no image generation · no photography sourcing · no pricing page changes · no W+erkles lockup changes · no Iron Palette token value changes · no deploy/push/SQL/secrets · no Bellows/content generation

---

## Executive summary

Tests 1–3 implemented as React components + CSS on the **homepage** (`/`). Iron Palette applied via existing CSS variables only. Four profile-card states, six lane cards (including **Worker**), and a three-state formation sequence with ghost slots and dossier frame are live for visual review.

**Maker recommendation:** **PATCH** — approve direction and component system; patch-gate hero integration (profile card in hero per Ender §7) and nav label `#people` → `#lanes` semantics before calling Tests 1–3 fully closed.

---

## Test 1 — Profile Card Design System

| State | Implemented | Visual differentiation |
|-------|-------------|------------------------|
| Undeclared | Yes | Dashed lane outline, iron border, spare metadata |
| Lane chosen | Yes | Role stamp, lane accent border, skills tags |
| In formation | Yes | Teal-adjacent lock ring, project + availability |
| Formed / Werkle history | Yes | Brass frame, Werkle label, formed date, inner dossier frame |

**Location:** `/#profile-cards` · component `components/visual-system/profile-card.tsx`

**Carries:** lane accent · role label · formation status · skills · availability · project state · formed metadata

---

## Test 2 — Lane Cards

| Lane | Implemented | Iron Palette accent (var) |
|------|-------------|---------------------------|
| Spark | Yes | `--werkles-violet-bright` |
| Operator | Yes | `--werkles-teal-bright` |
| Backer | Yes | `--werkles-copper-light` |
| Connector | Yes | `--werkles-forge-orange` |
| Builder | Yes | `--werkles-owl-eye-green` |
| Worker | Yes | `--werkles-blueprint-tan` |

**Rules:** no character art · no fantasy icons · no game UI · definition + three attributes each

**Location:** `/#lanes` · replaces legacy `#people` people-strip

---

## Test 3 — Formation Sequence

| State | Implemented |
|-------|-------------|
| Solo / empty slots | Yes — one filled card + ghost slot outlines |
| Partial formation | Yes — 3 filled + 2 ghosts + partial dossier lines |
| Werkle formed / dossier | Yes — 5 filled cards + formed dossier frame |

**Interaction:** tab buttons (no slot-machine animation) · subtle lock-settle on formed state · `prefers-reduced-motion` respected

**Location:** `/#formation`

---

## Files changed

| Path | Change |
|------|--------|
| `lib/visual-system/types.ts` | New — card/lane/formation types |
| `lib/visual-system/lanes.ts` | New — six lane definitions |
| `lib/visual-system/profile-cards.ts` | New — showcase models |
| `components/visual-system/profile-card.tsx` | New |
| `components/visual-system/lane-card.tsx` | New |
| `components/visual-system/formation-sequence.tsx` | New — client |
| `components/visual-system/ender-visual-tests-section.tsx` | New — homepage sections |
| `app/visual-system.css` | New — Iron Palette application styles |
| `app/globals.css` | Import visual-system.css · scroll anchors |
| `app/page.tsx` | Integrate tests · remove legacy people-strip |
| `components/foundry/site-header.tsx` | People nav → `/#lanes` |

**Not touched:** pricing · auth · dashboard core · Ghost Forge · Bellows · finance · crew dispatch · `lib/design-tokens.ts` values · brand mark

---

## Preview routes / sections

| URL | Section |
|-----|---------|
| http://localhost:3000/#profile-cards | Test 1 — four profile cards |
| http://localhost:3000/#lanes | Test 2 — six lane cards |
| http://localhost:3000/#formation | Test 3 — formation tabs + dossier |

Run: `npm run dev`

---

## Conditions / open items

1. Hero still uses `HeroStatic` — Ender §7 recommends profile-card hero; defer to next pass
2. Header label still says **People** while anchor is `#lanes`
3. Formation demo uses 5 slots (Spark, Operator, Backer, Connector, Builder) — **Worker** lane card exists but not in 5-role formation diagram
4. Demo names are placeholders — not production member data
5. Legacy `people-strip` CSS remains in stylesheet (unused on home)

---

## Recommendation

### **PATCH**

Approve Tests 1–3 component system and homepage preview for Ben walkthrough.

**Before APPROVE:**

- Ben confirms Worker lane + 5-slot formation model
- Optional: profile card partial-fill in hero (Test 1 extension)
- Optional: rename nav **People** → **Lanes** if `#lanes` is canonical

**NO-GO if:** Ben requires hero profile card and Worker in formation diagram before any visual sign-off.

---

## Next gate

`[AWAITING HUMAN GATE: ENDER_VISUAL_TESTS_1_3_REVIEW]` — Ben records APPROVE / PATCH / NO-GO in `foreman/gates/APPROVAL_LOG.md`
