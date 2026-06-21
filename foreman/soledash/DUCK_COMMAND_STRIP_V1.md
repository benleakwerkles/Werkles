# DUCK_COMMAND_STRIP_V1

**Mission:** DUCK COMMAND STRIP V1  
**Decision Owner:** Ben  
**Reviewer:** Ender @ Betsy  
**Return Destination:** Mobile SD Queue  
**Target device:** Duck (mobile viewport ≤768px or `?duck=1`)  
**Execution context:** LOCAL_SALLY_WINDOWS · Maker @ Betsy  

---

## Objective

Mobile-first command strip for SoleDash on Duck — thumb-operable frontier, relay, receipts, and gates without desktop chrome.

---

## Bottom thumb bar

| Tab | Content |
|-----|---------|
| **Command** | Current frontier + YEA/NAY/routes + relay cards |
| **Receipts** | Receipt list + full-width path taps |
| **Gates** | RED human gate (deliberate approve) or tier readout |
| **Review** | Pulse summary + frontier/working snapshot |

Badges on Receipts (count) and Gates (1 when RED).

---

## Rules compliance

| Rule | Implementation |
|------|----------------|
| No hover states | `@media (hover: hover)` neutralizes hover on `.sd-duck-*` |
| No desktop-only controls | `SoleDashHome` switches to Guillotine above 768px |
| No fake buttons | Relay FIRE only when `routeConnected`; disconnected READY cards hidden |
| Deliberate FIRE/APPROVE | Two-step `DeliberateTap` for YEA, FIRE, gate approve |
| Thumb-accessible receipts | Min 3rem row/path buttons; bottom sheet detail |

---

## Scope panels

### Command tab

- **Current Frontier** — code, title, evidence, summary, blocker
- **Frontier actions** — deliberate YEA; NAY; enabled route buttons only
- **Relay cards** — wired or in-flight only; artifact link; deliberate FIRE; open receipt

### Receipts tab

- Up to 20 entries
- Row tap → bottom sheet
- Receipt path as separate full-width thumb button

### Gates tab

- GREEN/BLUE: tier + operator line (no fake approve)
- RED: gate copy + deliberate approve + reject + defer

### Review tab

- Honesty badge + reality mode
- Working / blocked / returned pulse
- Frontier card + top working items + lifecycle line

---

## Files

| Path | Role |
|------|------|
| `components/soledash/duck-command-strip.tsx` | Strip UI + tabs + deliberate actions |
| `components/soledash/sole-dash-home.tsx` | Duck vs Guillotine viewport switch |
| `components/soledash/decision-surface.tsx` | Renders `SoleDashHome` on `/soledash` |
| `app/soledash/soledash.css` | `.sd-duck-*` styles + safe-area bottom bar |

---

## Verify on Duck

1. Open `/soledash` on phone or narrow browser (≤768px), or `/soledash?duck=1` on desktop.
2. Confirm fixed bottom bar: Command · Receipts · Gates · Review.
3. Tap YEA or FIRE — confirm step appears before execution.
4. Receipts tab — path buttons are full-width and tappable.
5. Desktop width without `?duck=1` — Guillotine surface still shows.

```bash
npm run typecheck
```

---

## Not in scope

- Native Duck app shell / PWA manifest
- Relay EDIT ROUTE / KILL TEST on strip (desktop guillotine only)
- Operator bar / intent memory chat
