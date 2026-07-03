# WONKA_DEN_SAFE_EXECUTOR_REPAIR_RECEIPT

Machine: Betsy
App: SoleDash / Wonka Den
URL: http://localhost:3000/soledash
Repo: C:\Users\Ben Leak\Desktop\github\Werkles

## Result

PASS - Wonka Den now accepts command IDs only. Raw UI command strings do not enter process execution.

## Contract

Allowed command IDs:

- PROVE_HOSTNAME
- PROVE_WHOAMI
- PROVE_GIT_STATUS
- PROVE_NODE_VERSION
- PROVE_NPM_VERSION
- PROVE_DIR_FOREMAN

Server mapping:

- PROVE_HOSTNAME -> cmd.exe /c hostname
- PROVE_WHOAMI -> whoami.exe
- PROVE_GIT_STATUS -> git status --short
- PROVE_NODE_VERSION -> node -v
- PROVE_NPM_VERSION -> npm -v
- PROVE_DIR_FOREMAN -> cmd.exe /c dir foreman

Execution rule:

- spawn with fixed executable + fixed args
- shell: false
- user text is never passed as executable or args

## Alive proof

```json
{
  "receipt_id": "wonka_den_1781688485224_983153",
  "command_id": "PROVE_HOSTNAME",
  "machine": "Betsy",
  "working_directory": "C:\\Users\\Ben Leak\\Desktop\\github\\Werkles",
  "timestamp": "2026-06-17T09:28:05.224Z",
  "verdict": "RECEIPT",
  "reason": null,
  "executable_label": "cmd.exe /c hostname",
  "stdout": "Betsy\r\n",
  "stderr": "",
  "exit_code": 0,
  "executed": true
}
```

## Kill test

All 10 Bean exploit attempts returned STOP and executed:false.

| Attempt | Verdict | Reason | Executed |
| --- | --- | --- | --- |
| PROVE_HOSTNAME && whoami | STOP | UNKNOWN_COMMAND_ID | false |
| PROVE_HOSTNAME;whoami | STOP | UNKNOWN_COMMAND_ID | false |
| PROVE_HOSTNAME \| type .env | STOP | UNKNOWN_COMMAND_ID | false |
| git push | STOP | UNKNOWN_COMMAND_ID | false |
| git reset --hard | STOP | UNKNOWN_COMMAND_ID | false |
| git clean -fd | STOP | UNKNOWN_COMMAND_ID | false |
| npm install | STOP | UNKNOWN_COMMAND_ID | false |
| powershell -enc ZQBjAGgAbwA= | STOP | UNKNOWN_COMMAND_ID | false |
| rm -rf foreman | STOP | UNKNOWN_COMMAND_ID | false |
| cat .env | STOP | UNKNOWN_COMMAND_ID | false |

## Verification

- npm.cmd run typecheck: PASS
- http://localhost:3000/soledash: HTTP 200
- Prove the Den is Alive API proof: PASS, stdout Betsy
- Unknown command ID behavior: STOP, UNKNOWN_COMMAND_ID, executed:false

## Files changed

- app/api/soledash/v1/wonka-den/run-safe-command/route.ts
- components/soledash/wonka-den-terminal-proof.tsx
- foreman/soledash/WONKA_DEN_SAFE_EXECUTOR_REPAIR_RECEIPT.md
