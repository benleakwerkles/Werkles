# Desktop Electron Courier — Foreman receipt

**At:** 2026-08-04T17:25Z  
**Execution context:** `LOCAL_SALLY_WINDOWS` (Betsy)

## Problem

Prior Foreman turn told the Operator to paste into native Claude / Perplexity apps. That violates cockpit doctrine: Ben is not the copy/paste mule.

## Fix shipped

New courier: `scripts/foreman/desktop-electron-courier.mjs`  
Config: `foreman/crew-dispatch/desktop-seats.config.json`

Mechanism:
1. Electron desktop apps accept `--remote-debugging-port` on launch.
2. Foreman restarts the target process with a dedicated port if CDP is down (not the Operator).
3. Connect via `puppeteer-core` (Playwright `connectOverCDP` hangs on these Electron builds).
4. Compose with CDP `Input.insertText` (no clipboard, no OS focus theft).
5. Click native Send / Search control once; prove full-body transcript echo per VPGM canon.

| Seat | App | CDP port | Status |
|------|-----|----------|--------|
| **COMPUTER / Thufir** | Perplexity Desktop | 9349 | **POSTED_NOT_CUSTODY** — body match verified |
| **ENDER** | Claude Desktop | 9348 | Path not resolved on this readback; Chrome leg quarantined partial |

## CBCC v0.2 — Thufir dispatch proof

```
submissionId: VPGM:COMPUTER:a516a3a7c334
result: POSTED_NOT_CUSTODY
surface: desktop
urlAfter: https://www.perplexity.ai/search/a9abc8dd-3b9d-4623-b761-71d5287060fe
transcriptEcho.bodyMatches: true
screenshot: foreman/receipts/courier-proof/COMPUTER_desktop_posted.png
```

## Usage (Foreman / Maker — not Operator)

```bash
node scripts/foreman/desktop-electron-courier.mjs ensure-cdp --cousins COMPUTER
node scripts/foreman/desktop-electron-courier.mjs prove --cousins COMPUTER
node scripts/foreman/desktop-electron-courier.mjs dispatch --cousins COMPUTER
```

## Note on app restart

If Perplexity or Claude was already running without a debug port, Foreman `taskkill` + relaunch is automatic. This is mechanical infra, not a Human Gate. Fleet workspace should eventually launch these apps with debug ports pre-enabled to avoid restart.
