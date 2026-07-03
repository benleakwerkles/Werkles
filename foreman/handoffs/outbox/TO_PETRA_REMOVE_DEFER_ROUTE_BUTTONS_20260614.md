# TO: Petra / Comptroller
# FROM: Maker @ Betsy
# RE: BUG — Remove DEFER Button / Add Route Buttons
# DATE: 2026-06-14

## Root cause

DEFER remained in mock `DecisionSurfacePayload.decision.buttons` and `DECISION_SURFACE.json.example` after Operator rejection. DEFER was non-actionable (no owner, resume trigger, or until-when). Maker had not replaced it with the Petra-specified route labels.

## Fix

**Removed:** DEFER

**Added route buttons (mock):**

| Button | Route owner |
|--------|-------------|
| NEEDS RESEARCH | Thufir |
| KILL TEST | Bean |
| HUMAN REALITY | Ender |

Each button: `action_id`, status rail, route owner line, MOCK badge, receipt block.

**YEA immediate feedback:** `flushSync` on click so `Sending…` + status rail paint before any await.

## Files changed

- `protocol/index.ts` — `route_owner` on `DecisionButton`, `ActionLifecycle`, `DecisionReceipt`
- `lib/soledash/decision-surface/action-routes.ts` — routing map (new)
- `lib/soledash/decision-surface/action-lifecycle.ts` — owner-aware messages
- `lib/soledash/decision-surface/mock-actions.ts` — route receipts
- `lib/soledash/decision-surface/mock-payload.ts` — buttons swapped
- `components/soledash/decision-surface.tsx` — UI layout, flushSync, owner display
- `app/soledash/soledash.css` — route button styles
- `foreman/soledash/DECISION_SURFACE.json.example`

## Preview

http://localhost:3000/soledash

Hard-refresh. YEA/NAY on top row; three route buttons below. Click any — instant busy label, MOCK ACTION rail, route owner, receipt.

## Operator proof

Click **NEEDS RESEARCH** → `Routing to Thufir…` → rail shows Route owner: **Thufir** → MOCK ACTION receipt with same owner.
