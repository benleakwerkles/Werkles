# TO: Petra / Comptroller
# FROM: Maker @ Betsy
# RE: MISSION — Mock Test Harness For SoleDash
# DATE: 2026-06-12

## Problem solved

Mock buttons no longer feel dead. Every mock action now animates lifecycle, writes a test receipt, and surfaces in Receipt Center with **MOCK TEST** badge.

## Built

### 1. Visible mock feedback (every click)

- Button **Working…** state while animating
- **Action rail** steps: clicked → queued → sent → received → working → resolved (or failed path)
- **Receipt row** with timestamp, target, status, `simulated: true`, **MOCK TEST** badge
- **Compact receipt rail** on frontier card updates live

### 2. MOCK TEST MODE banner

Shown when reality is not pure LIVE (MOCK, PARTIAL LIVE, unavailable):

> MOCK TEST MODE  
> Actions simulate transport and generate receipts. No external machine command executed.

### 3. Mock action lifecycle

Success path: clicked → queued → sent → received → working → resolved  
Failure paths via toggle (see below)

### 4. Test receipt writer

Server writes when filesystem available:

`foreman/soledash/receipts/mock_test_<timestamp>.json`  
`foreman/soledash/actions/mock_test_<timestamp>.json`

Fallback: **CLIENT-ONLY MOCK RECEIPT** in localStorage + session state.

**Generated this session:** `foreman/soledash/receipts/mock_test_1781534578978.json` (Needs Research · success)

### 5. Run Mock Test buttons (8 routes)

Continue Current Frontier · Switch Frontier · Needs Research · Kill Test · Human Reality · Hands Gate · Send to Petra · Test Spanzee

Pivot bar + YEA/NAY + route buttons also route through the same harness.

### 6. Last Mock Test panel

Shows: action · route · status · receipt id · would happen live · why simulated · written_to

Persisted in localStorage across command opens.

### 7. Failure simulation toggle

- Success
- Failed transport (clicked → queued → failed)
- Blocked by RED gate (… → failed)
- Waiting for owner (stalls at working)
- Missing live payload (clicked → failed)

## Preview

http://localhost:3000/soledash → Open Command → Mock Test Harness

## Files changed

- `protocol/index.ts` — MockTestRoute, MockTestResult, MockTestRunResponse, mock_test on receipts
- `lib/soledash/mock-test/routes.ts` (new)
- `lib/soledash/mock-test/shared.ts` (new, client-safe)
- `lib/soledash/mock-test/run-mock-test.ts` (new)
- `lib/soledash/mock-test/write-test-receipt.ts` (new)
- `lib/soledash/mock-test/client-runner.ts` (new)
- `app/api/soledash/v1/mock-test/run/route.ts` (new)
- `components/soledash/mock-test-harness.tsx` (new)
- `components/soledash/decision-surface.tsx` — animated mock actions, merged receipts
- `components/soledash/decision-surface-panels.tsx` — MOCK TEST badge on receipts
- `lib/soledash/decision-surface/load-live-transport.ts` — load mock_test receipts
- `app/soledash/soledash.css` — harness + banner styles

## Mock receipts generated

- `foreman/soledash/receipts/mock_test_1781534578978.json`

## What remains untestable until live transport

- Real cousin auto-dispatch (Thufir / Bean / Ender lanes)
- Real Petra browser-tab injection on Betsy
- Real Spanzee node polling
- Dink-owned queue brain refresh after override (Make Frontier POST is separate)
- Non-simulated LIVE receipts without `simulated: true`

## Success

Ben can click any mock button and immediately see UI/action/receipt flow. No silent mock buttons.
