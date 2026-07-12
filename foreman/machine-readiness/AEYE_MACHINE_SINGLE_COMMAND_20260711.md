# Aeye Machine Single Command - 2026-07-11

Mode: one-copy-paste machine readiness command, no secrets

## Why This Exists

No, each machine should not need three separate manual script runs.

Use one wrapper:

- `Invoke-AeyeMachineReadiness.ps1`

It runs:

- `Test-AeyeMachineCredentialBaseline.ps1`
- `Test-AeyeWorkspaceCliBaseline.ps1`

It also uses `rg` to print the relevant packet anchors when `rg` is installed.

## COPY_PASTE

Set the nickname and paste this into PowerShell on the target machine:

```powershell
$N="MACHINE_NICKNAME"; $R=@("$env:USERPROFILE\Documents\1password Project","C:\Users\BenLeak\Documents\1password Project","C:\Users\Ben Leak\Documents\1password Project") | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1; if(-not $R){ throw "1password Project folder not found on this machine" }; Set-Location -LiteralPath $R; if(Get-Command rg -ErrorAction SilentlyContinue){ rg -n "COPY_PASTE|Universal No-Items|Workspace And CLI|Machine Checklist|Success Definition" .\AEYE_MACHINE_SINGLE_COMMAND_20260711.md .\AEYE_MACHINE_CREDENTIAL_BASELINE_20260711.md .\AEYE_WORKSPACE_AND_CLI_BASELINE_20260711.md .\PASSWORD_CHECKLIST_ACTIVE_QUEUE_20260711.md }; powershell -NoProfile -ExecutionPolicy Bypass -File .\Invoke-AeyeMachineReadiness.ps1 -Nickname $N
```

Examples:

```powershell
$N="Betsy"; $R=@("$env:USERPROFILE\Documents\1password Project","C:\Users\BenLeak\Documents\1password Project","C:\Users\Ben Leak\Documents\1password Project") | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1; if(-not $R){ throw "1password Project folder not found on this machine" }; Set-Location -LiteralPath $R; if(Get-Command rg -ErrorAction SilentlyContinue){ rg -n "COPY_PASTE|Universal No-Items|Workspace And CLI|Machine Checklist|Success Definition" .\AEYE_MACHINE_SINGLE_COMMAND_20260711.md .\AEYE_MACHINE_CREDENTIAL_BASELINE_20260711.md .\AEYE_WORKSPACE_AND_CLI_BASELINE_20260711.md .\PASSWORD_CHECKLIST_ACTIVE_QUEUE_20260711.md }; powershell -NoProfile -ExecutionPolicy Bypass -File .\Invoke-AeyeMachineReadiness.ps1 -Nickname $N
```

```powershell
$N="Spanzee"; $R=@("$env:USERPROFILE\Documents\1password Project","C:\Users\BenLeak\Documents\1password Project","C:\Users\Ben Leak\Documents\1password Project") | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1; if(-not $R){ throw "1password Project folder not found on this machine" }; Set-Location -LiteralPath $R; if(Get-Command rg -ErrorAction SilentlyContinue){ rg -n "COPY_PASTE|Universal No-Items|Workspace And CLI|Machine Checklist|Success Definition" .\AEYE_MACHINE_SINGLE_COMMAND_20260711.md .\AEYE_MACHINE_CREDENTIAL_BASELINE_20260711.md .\AEYE_WORKSPACE_AND_CLI_BASELINE_20260711.md .\PASSWORD_CHECKLIST_ACTIVE_QUEUE_20260711.md }; powershell -NoProfile -ExecutionPolicy Bypass -File .\Invoke-AeyeMachineReadiness.ps1 -Nickname $N
```

```powershell
$N="Medullina"; $R=@("$env:USERPROFILE\Documents\1password Project","C:\Users\BenLeak\Documents\1password Project","C:\Users\Ben Leak\Documents\1password Project") | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1; if(-not $R){ throw "1password Project folder not found on this machine" }; Set-Location -LiteralPath $R; if(Get-Command rg -ErrorAction SilentlyContinue){ rg -n "COPY_PASTE|Universal No-Items|Workspace And CLI|Machine Checklist|Success Definition" .\AEYE_MACHINE_SINGLE_COMMAND_20260711.md .\AEYE_MACHINE_CREDENTIAL_BASELINE_20260711.md .\AEYE_WORKSPACE_AND_CLI_BASELINE_20260711.md .\PASSWORD_CHECKLIST_ACTIVE_QUEUE_20260711.md }; powershell -NoProfile -ExecutionPolicy Bypass -File .\Invoke-AeyeMachineReadiness.ps1 -Nickname $N
```

## Output

The wrapper writes:

- one credential receipt
- one workspace/CLI receipt
- one combined summary receipt

Default location:

- `Receipts\`

The wrapper prints:

- `SUMMARY_RECEIPT=...`
- `SUMMARY_SHA256=...`
- `CREDENTIAL_STATUS=...`
- `WORKSPACE_CLI_STATUS=...`
- `BLOCKERS=...`

## What It Does Not Do

It does not:

- run `op account list`
- run `op whoami`
- run `gh auth status`
- run provider login/auth commands
- deploy anything
- read or print secrets
- move/delete/share 1Password items
- clone, reset, or mutate repos

## If The Folder Is Missing

If the target machine does not have `C:\Users\<user>\Documents\1password Project`, the command will stop with:

```text
1password Project folder not found on this machine
```

That means the project folder has to be synced/copied/cloned to that machine before the one-command baseline can run.
