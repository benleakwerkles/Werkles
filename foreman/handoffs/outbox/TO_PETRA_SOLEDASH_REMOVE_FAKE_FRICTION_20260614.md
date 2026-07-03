# TO: Petra / Comptroller
# FROM: Maker @ Betsy
# RE: MISSION — Remove Remaining Fake Surface Friction
# DATE: 2026-06-14

## Built

### 1. DEFER removed (decision surface)
- Route slots fixed: **NEEDS RESEARCH**, **KILL TEST**, **HUMAN REALITY**
- All three always visible; disabled with tooltip when Dink omits slot or payload unavailable
- No DEFER in decision-surface path

### 2. Queue Override Surface
- Every queue item: **Inspect** + **Make Frontier** (unchanged, verified)

### 3. Frontier Comparison (new)
- Always-visible side-by-side: **Machine Frontier** vs **Operator Frontier**
- Source badge: **MACHINE** / **OPERATOR** / **MIXED**

### 4. Receipt Visibility
- Receipt Center always visible
- **Most recent receipt pinned** at top with status + SIMULATED/LIVE label
- Full table below for history

### 5. AEYE Branding
- Centered wordmark row, `object-fit: contain`, max-width 20rem, no clip frame

### 6. Current Reality Banner (new, top of page)
- **LIVE** — Dink file transport, no simulated markers
- **PARTIAL LIVE** — file-backed with `simulated:true` receipts/actions
- **MOCK** — no live file or `mock:true`

### YEA responsiveness
- `flushSync` on click → immediate **Sending…** state before API round-trip

## Preview

http://localhost:3000/soledash

## Files changed

- `lib/soledash/decision-surface/reality-mode.ts` (new)
- `lib/soledash/decision-surface/action-routes.ts` — `mergeRouteButtons`, no DEFER
- `lib/soledash/decision-surface/load-contract.ts` — `reality_mode` on view
- `components/soledash/decision-surface-panels.tsx` — Reality banner, Frontier Comparison, pinned receipt
- `components/soledash/decision-surface.tsx` — wire-up, instant YEA feedback
- `app/soledash/soledash.css` — reality, comparison, pin, logo styles
- `protocol/index.ts` — `reality_mode` on view type

## Success

Operator immediately sees: LIVE vs PARTIAL LIVE vs MOCK, who chose frontier, machine vs operator comparison, pinned latest receipt, and live button feedback on YEA.
