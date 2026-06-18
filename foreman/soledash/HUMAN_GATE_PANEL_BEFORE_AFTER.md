# HUMAN GATE PANEL — BEFORE / AFTER

**From:** Maker (Cursor) @ LOCAL_SALLY_WINDOWS  
**Date:** 2026-06-12  
**Mission:** Human Gate Panel rewrite — show only RED gates  
**Execution context:** LOCAL_SALLY_WINDOWS · SoleDash `@ /soledash` · live payload `foreman/soledash/DECISION_SURFACE.json`

---

## Goal

Traffic-light gate model on the SoleDash command surface:

| Tier | Rule |
|------|------|
| **GREEN** | Invisible — no approval card, no waiting-gate badge |
| **BLUE** | Execute first — receipt after; no pre-approval card |
| **RED** | Visible Human Gate card — why, consequence, Approve / Reject / Defer |

---

## BEFORE (approval clutter)

Every command session surfaced gate-like UI regardless of whether Dink classified a true human gate:

| Surface | Behavior |
|---------|----------|
| **Mobile Hands panel** | Always visible on mobile Command — prompt, reason field, Approve / Reject / Needs research / Kill test |
| **Guarded YEA confirm** | Two-step YEA (“Send YEA? Confirm…”) on desktop Command |
| **Gate detail tier** | Collapsible “Gate detail” accordion with classification, operator line, transport gap — always rendered |
| **Operator bar — Waiting gates** | Chip always visible (often `0`) |
| **Mobile frontier gate line** | Informational `human_gate.operator_line` shown even when not a RED stop |
| **Waiting-gates heuristic** | Broad match on classification substrings (`human_gate`, `red`, `waiting`, `stop`) — risk of false-positive badge |

**Live payload example (`classification: live_transport`):**  
Mechanical transport info was still surrounded by Hands / confirm / gate-detail chrome — operator read it as “something needs approval.”

**Approximate approval-adjacent blocks on Command (desktop + mobile):** 4–5 persistent UI regions.

---

## AFTER (RED-only)

### Tier resolver

`lib/soledash/human-gate/tiers.ts` maps Dink `human_gate` + `approval-classifier` to `green | blue | red`:

- **RED:** `transport_gap`, `STOP: HUMAN GATE`, true-gate classifications, classifier `TRUE_HUMAN_GATE` / `BLOCKED`
- **GREEN:** `live_transport`, `PROCEED: not a human gate`, mechanical markers, classifier `SAFE_MECHANICAL`, default fallback
- **BLUE:** mock/sim/file-backed paths — execute without pre-approval card; receipt rail after action

### UI by tier

| Tier | Command surface |
|------|-----------------|
| **GREEN** | No Human Gate card. Direct YEA/NAY (no confirm step). Waiting-gates chip hidden. No gate-detail tier. |
| **BLUE** | No Human Gate card. Direct YEA/NAY + “Receipt after execution” hint. `CompactReceiptRail` shows outcome post-dispatch. |
| **RED** | **`HumanGatePanel` only** — why approval required, consequence, transport gap (if any), Approve / Reject / Defer. YEA/NAY hidden from Command actions (RED card owns approve). Waiting-gates badge = 1. |

### Removed / gated surfaces

| Removed or gated | Replacement |
|------------------|---------------|
| `MobileHandsPanel` on Command | Removed from `decision-surface.tsx` (component retained, unused) |
| `GuardedYeaNay` on Command | `DirectYeaNay` for GREEN/BLUE; hidden on RED |
| `HumanGateDetail` tier | Removed; RED content lives in `HumanGatePanel` |
| Operator “Waiting gates” chip at 0 | Chip not rendered unless RED waiting |
| Mobile informational gate line | Only RED waiting alert shown |

**Live payload now:** `live_transport` → **GREEN** → **zero** Human Gate cards, **zero** waiting-gate badge.

**Approximate approval-adjacent blocks on Command (live GREEN):** 0 gate cards; frontier YEA/NAY remain mechanical dispatch (not RED approval cards).

---

## Files

| File | Role |
|------|------|
| `lib/soledash/human-gate/types.ts` | `GateTier`, `RedGateCard`, `GateResolution` |
| `lib/soledash/human-gate/tiers.ts` | `resolveGateTier`, `resolveHumanGate`, `buildRedGateCard` |
| `components/soledash/human-gate-panel.tsx` | RED-only approval card |
| `components/soledash/command-actions.tsx` | Tier-aware approve block (hidden on RED) |
| `components/soledash/ambient-command-layers.tsx` | `DirectYeaNay` — no confirm step |
| `components/soledash/decision-surface.tsx` | Wire tier resolution, RED panel, waiting-gate count |
| `components/soledash/operator-bar.tsx` | Hide waiting-gates chip when count = 0 |
| `components/soledash/mobile-field-command.tsx` | Drop informational gate line on non-RED |
| `app/soledash/soledash.css` | `.sd-hgate-*`, blue receipt hints |
| `scripts/soledash/human-gate-tiers-smoke.ts` | Tier classification smoke |
| `package.json` | `npm run test:human-gate` |

---

## Acceptance check

| Criterion | Status |
|-----------|--------|
| GREEN invisible | Pass — `live_transport` payload shows no gate card or waiting badge |
| BLUE execute then receipt | Pass — direct YEA/NAY + receipt rail; no pre-approval card |
| RED visible approval card | Pass — `HumanGatePanel` with why / consequence / Approve / Reject / Defer |
| Approval clutter reduced dramatically | Pass — 4–5 gate-adjacent blocks → 0 on current live GREEN payload |

---

## Verify locally (Betsy)

```powershell
npm run test:human-gate
# dev server on :3002 (or your port)
# Open Command → confirm no Hands panel, no Gate detail tier, no Waiting gates chip
```

**Force RED (dev):** temporarily set in `foreman/soledash/DECISION_SURFACE.json`:

```json
"human_gate": {
  "classification": "true_human_gate",
  "operator_prompt": "git push requires Ben approval",
  "operator_line": "STOP: HUMAN GATE.",
  "detail": "Push to origin is a foreman hard stop.",
  "transport_gap": null
}
```

Refresh → RED card appears; Approve / Reject / Defer visible; Command YEA/NAY approve block hidden.

---

## Remaining (not gate clutter)

- Mobile frontier **“Waiting on Ben”** line — frontier summary, not gate tier (Dink owns copy).
- `GuardedYeaNay` / `MobileHandsPanel` exports — dead code; safe to delete in a cleanup pass.
- Options-deck YEA on RED tier returns “Use RED Human Gate card to approve” — intentional guardrail.

---

## Dink contract

Dink supplies `human_gate` on `DECISION_SURFACE.json`. Maker renders:

- `classification` + lines → tier via `resolveHumanGate`
- RED only when Dink or classifier says true stop
- Ben never sees approval cards for mechanical GREEN actions
