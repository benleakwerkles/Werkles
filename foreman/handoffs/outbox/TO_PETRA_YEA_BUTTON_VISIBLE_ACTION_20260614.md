# TO: Petra / Comptroller
# FROM: Maker @ Betsy
# RE: BUG — YEA Button Has No Visible Action
# DATE: 2026-06-14

## Root cause

Two compounding bugs made YEA feel silent:

1. **`runAction` called `refresh()` after every click.** Background poll re-loaded mock `DECISION_SURFACE` payload, which always has empty `decision_receipt` and `action_lifecycle: idle`. That **wiped the receipt and status rail** milliseconds after the animation finished.

2. **Mock API returned lifecycle phase `sent`**, regressing the UI from `resolved` back to mid-pipeline. Combined with (1), Operator saw a brief flash or nothing at all.

3. **No synchronous lifecycle update on click** — first visual feedback waited for async animation loop (200ms+). Button showed `YEA…` not `Sending…`.

## Fix

- **Immediate sync feedback:** `clicked` lifecycle + `action_id` created on click before any await.
- **Button label:** YEA → `Sending…` while in flight.
- **Lifecycle rail (Petra spec):** clicked → queued → sent → sim received → sim working → resolved (or failed).
- **MOCK ACTION badge** on rail + receipt when mock transport.
- **Receipt persists** — refresh no longer overwrites local receipt/lifecycle when resolved or failed.
- **Removed post-action `refresh()`** — no self-sabotage.
- **Error path:** failed phase + visible `failure_reason` if handler errors.
- **Protocol:** `action_id` on `ActionLifecycle`; phases `queued` + `received` replace `en_route`.

## Files changed

- `protocol/index.ts`
- `lib/soledash/decision-surface/action-lifecycle.ts`
- `lib/soledash/decision-surface/mock-actions.ts`
- `lib/soledash/decision-surface/mock-payload.ts`
- `components/soledash/decision-surface.tsx`
- `app/api/soledash/v1/decision-surface/action/route.ts`
- `app/soledash/soledash.css`

## Preview

http://localhost:3000/soledash

## Success criteria met

Ben clicks YEA → instantly sees `Sending…`, MOCK ACTION rail, `action_id`, then receipt block at resolved. No silent buttons.

## Operator proof

Hard-refresh `/soledash`, click YEA once. Rail and receipt must remain visible after completion (not vanish on poll).
