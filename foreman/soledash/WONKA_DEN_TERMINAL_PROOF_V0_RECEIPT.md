# WONKA_DEN_TERMINAL_PROOF_V0_RECEIPT

Machine: Betsy
App: SoleDash / Wonka Den
Working URL: http://localhost:3000/soledash
Repo path: C:\Users\Ben Leak\Desktop\github\Werkles
Timestamp: 2026-06-17T09:21:09.745Z

## Result

PASS - Wonka Den can run one locked safe local terminal command from the UI/API path and return a receipt.

## Files changed

- app/api/soledash/v1/wonka-den/run-safe-command/route.ts
- components/soledash/wonka-den-terminal-proof.tsx
- components/soledash/guillotine-surface.tsx
- app/soledash/soledash.css
- foreman/soledash/WONKA_DEN_TERMINAL_PROOF_V0_RECEIPT.md

## Safe command proof

Command: hostname
Allowed: true
Machine: Betsy
Working directory: C:\Users\Ben Leak\Desktop\github\Werkles
Stdout: Betsy
Stderr:
Exit code: 0

Receipt path:
foreman/soledash/wonka-den/receipts/wonka_den_1781688069745_173cf9.json

Copied receipt:

```json
{
  "receipt_id": "wonka_den_1781688069745_173cf9",
  "requested_command": "hostname",
  "machine": "Betsy",
  "working_directory": "C:\\Users\\Ben Leak\\Desktop\\github\\Werkles",
  "timestamp": "2026-06-17T09:21:09.745Z",
  "allowed": true,
  "blocked_reason": null,
  "stdout": "Betsy\r\n",
  "stderr": "",
  "exit_code": 0
}
```

## Blocked command proof

Command: git push
Allowed: false
Result: blocked before execution by exact allowlist classifier.

## Allowlist

- whoami
- hostname
- git status --short
- node -v
- npm -v
- pwd / cd / repo path / working directory
- dir foreman

## Verification

- Typecheck: pass
- Local page check: http://localhost:3000/soledash returned HTTP 200
- UI surface: Ask the Den input, Run Safe Command button, and Prove the Den is Alive button added
- Screenshot: not captured. In-app browser launch failed with Windows sandbox CreateProcessAsUserW failed: 5; fallback Playwright screenshot failed because the local Chromium browser binary is not installed. Copied receipt above is the proof artifact.

## Hard stops honored

- No arbitrary shell execution
- No destructive commands
- No rm/del
- No install
- No env dump
- No secrets
- No git push
