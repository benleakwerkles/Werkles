# Homepage Narrative v1 — Wire Preview Results

**Mission:** `WERKLES_NARRATIVE_ASSET_WIRE_PREVIEW`  
**Preview URL:** http://localhost:3002/ (or `:3001` if port differs)  
**Toggle:** `NARRATIVE_V1_WIRE_ENABLED` in `lib/homepage-narrative-imagery.ts`

---

## Files changed (wire scope)

| File | Role |
|------|------|
| `lib/homepage-narrative-imagery.ts` | Asset paths + wire toggle |
| `components/foundry/hero-static.tsx` | Hero class `hero--narrative-v1` |
| `components/foundry/space-beat-section.tsx` | `#space` with D01 photo |
| `components/foundry/narrative-scroll-rhyme.tsx` | D02 → A03 pair |
| `app/page.tsx` | Section order + ops proof class |
| `app/globals.css` | Hero, space, rhyme, proof-card scrim tokens |

**Not used:** `foundry-b01-shop-floor` (per mission).

---

## Screenshots

| # | Path |
|---|------|
| Hero (Spark C01) | `foreman/ghost-forge/wire-preview/01-hero-spark-c01.png` |
| Space (D01) | `foreman/ghost-forge/wire-preview/02-space-d01.png` |
| Scroll rhyme (D02 + A03) | `foreman/ghost-forge/wire-preview/03-scroll-rhyme-d02-forge-a03.png` |
| Ops / proof (B02 texture) | `foreman/ghost-forge/wire-preview/04-ops-proof-b02.png` |

---

## Reads better than placeholder/stock?

**Yes — materially better.**

| Beat | Before | After |
|------|--------|-------|
| Spark | Batch 1 / stock or CSS plate | C01 kitchen table — doctrine-aligned Spark |
| Space | Dashed CSS placeholder | D01 inhabited bakery pause |
| Space→Forge | None | D02 empty build → A03 two on plan — strongest scroll moment |
| Ops proof | Flat CSS trust plate only | B02 subtle hands/work scrim (readable) |

The page now **scrolls as a story** instead of a component demo with a missing frame.

---

## foundry-b02 — earn its place?

**Conditional hold — keep as texture, not as proof hero.**

- At current scrim strength (~94% warm paper gradient), B02 is **barely visible** on the proof ops card — good for text legibility, weak as “proof imagery.”
- The asset itself is **Forge-grade** (hands on leather), not Foundry “now it ships” at scale.
- **Recommendation:** Keep B02 as **optional subtle ops-card texture** OR remove and stay CSS-only until a stronger Foundry outcome shot lands. Do **not** promote B02 to gallery hero or primary proof.

---

## Preview anchors

- http://localhost:3002/#space
- http://localhost:3002/ (hero fold)
- Scroll to “Space → Forge” band before `#lanes`
