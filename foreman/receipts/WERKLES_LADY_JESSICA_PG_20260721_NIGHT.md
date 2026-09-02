# Lady Jessica P,G receipt — 2026-07-21 night

Date: 2026-07-21  
Seat: LadyJessica@Betsy  
Operator: `P, G/` (treated as `P, G.`)  
Branch: `maker/site-g-20260703` @ `674f3db` (= origin tip)

## LOCAL HANDS

Machine: Betsy · repo `C:\Users\Ben Leak\github\Werkles` · dirty tree · `:3000` was down → restarted `npm run dev`

## P — packets / Flock

| Item | State |
|------|--------|
| Effective gate | Live Crucible HG-3→HG-5 (phrase one still waiting) |
| Also waiting | Open prod intake / VPG10 push |
| Approval log | No `LIVE STRIPE PRODUCT CREATE` / open-intake / VPG10 push phrases |
| Live-Crucible Tier 1 packet | Present |
| Waiting-phrases card | Present (`TO_OPERATOR_WERKLES_COM_WAITING_PHRASES_20260721.md`) |

## G — two strongest

### 1. Restore localhost + hygiene

- VPG8 surface test: **PASS**
- Started `npm run dev` (was not listening)
- Local: `/bellows`, `/bellows/intake`, `/bellows/recommendations`, `/recommendations/test-case-0` → **200**

### 2. Prod nested Bellows 404 diagnosis (read-only)

Routing in repo is normal App Router; no next.config redirect; middleware does **not** match `/bellows/*`.

| URL | Code |
|-----|------|
| `https://werkles.com/bellows` | **200** |
| `https://werkles.com/bellows/intake` | **404** |
| `https://werkles.com/bellows/recommendations` | **404** |
| `https://werkles.com/bellows/recommendations/test-case-0` | **404** |
| `https://werkles.com/` | **200** |
| `https://werkles.com/dashboard/crucible` | **200** |

**Verdict:** Production deploy lineage is missing nested `/bellows/*` pages that exist on this branch locally. Not a middleware block. Fix path is a scoped push/deploy (separate human gate — e.g. VPG10 UI push or broader G deploy), not an intake-open flag flip alone.

## Hard stops preserved

```text
STOP: HUMAN GATE — no HG-3/4/5, no prod intake open, no VPG10 push/deploy without Operator phrases
```

`COMPLETED`
