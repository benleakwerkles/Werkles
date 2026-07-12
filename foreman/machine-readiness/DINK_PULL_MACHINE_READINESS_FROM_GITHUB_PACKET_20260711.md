# Dink Pull Machine Readiness From GitHub Packet - 2026-07-11

Target: every machine-local Dink / Handeye

Mode: pull sanitized machine-readiness packet files from GitHub, run one local readiness wrapper, return receipts

## Mission

Stop making Ben run separate setup files on every machine.

Each machine-local Dink should:

1. Pull the machine-readiness packet files from GitHub.
2. Run one wrapper locally.
3. Return the summary receipt path, SHA-256, blockers, and the two child receipt paths.

## GitHub Source

Repo:

- `https://github.com/benleakwerkles/Werkles.git`

Source folder inside repo:

- `foreman/machine-readiness/`

Branch:

- `machine-readiness-packets-20260711`

Required files:

- `DINK_PULL_MACHINE_READINESS_FROM_GITHUB_PACKET_20260711.md`
- `AEYE_MACHINE_SINGLE_COMMAND_20260711.md`
- `AEYE_MACHINE_CREDENTIAL_BASELINE_20260711.md`
- `AEYE_WORKSPACE_AND_CLI_BASELINE_20260711.md`
- `Invoke-AeyeMachineReadiness.ps1`
- `Test-AeyeMachineCredentialBaseline.ps1`
- `Test-AeyeWorkspaceCliBaseline.ps1`

## Hard Boundaries

Do not:

- read, print, copy, export, or transform passwords
- read, print, copy, export, or transform OTP seeds, passkeys, recovery codes, Secret Keys, tokens, notes, banking numbers, card numbers, SSNs, or secret answers
- run `op account list`
- run `op whoami`
- run `gh auth status`
- run provider login/auth commands
- deploy anything
- move/delete/share 1Password items
- reset, clean, checkout, or mutate an existing dirty repo

Allowed:

- `git fetch`
- `git clone --depth 1` into a packet cache if no local Werkles repo exists
- `git show` files out of `origin/machine-readiness-packets-20260711`
- write the sanitized packet files into the local `Documents\1password Project` folder
- run `Invoke-AeyeMachineReadiness.ps1`
- return redacted receipts

## DINK_COPY_PASTE

Set the nickname and run this on the target machine.

This command avoids switching branches in an existing Werkles repo. It fetches `origin/machine-readiness-packets-20260711`, exports only the machine-readiness files into `Documents\1password Project`, then runs the wrapper.

```powershell
$N="MACHINE_NICKNAME"; $Branch="machine-readiness-packets-20260711"; $Dest=Join-Path $env:USERPROFILE "Documents\1password Project"; New-Item -ItemType Directory -Force -Path $Dest | Out-Null; $Candidates=@("$env:USERPROFILE\github\Werkles","$env:USERPROFILE\Desktop\github\Werkles","C:\Users\BenLeak\github\Werkles","C:\Users\Ben Leak\github\Werkles") | Where-Object { Test-Path -LiteralPath (Join-Path $_ ".git") }; $Repo=$Candidates | Select-Object -First 1; if($Repo){ git -C $Repo fetch origin $Branch; $Ref="origin/$Branch" } else { $Cache=Join-Path $Dest "_werkles_packet_source"; if(Test-Path -LiteralPath $Cache){ git -C $Cache fetch origin $Branch; $Repo=$Cache; $Ref="origin/$Branch" } else { git clone --depth 1 --branch $Branch https://github.com/benleakwerkles/Werkles.git $Cache; $Repo=$Cache; $Ref="HEAD" } }; $Files=@("DINK_PULL_MACHINE_READINESS_FROM_GITHUB_PACKET_20260711.md","AEYE_MACHINE_SINGLE_COMMAND_20260711.md","AEYE_MACHINE_CREDENTIAL_BASELINE_20260711.md","AEYE_WORKSPACE_AND_CLI_BASELINE_20260711.md","Invoke-AeyeMachineReadiness.ps1","Test-AeyeMachineCredentialBaseline.ps1","Test-AeyeWorkspaceCliBaseline.ps1"); foreach($F in $Files){ $Text=git -C $Repo show "$Ref`:foreman/machine-readiness/$F"; if($LASTEXITCODE -ne 0){ throw "Failed to pull $F from $Ref" }; Set-Content -LiteralPath (Join-Path $Dest $F) -Value $Text -Encoding UTF8 }; Set-Location -LiteralPath $Dest; if(Get-Command rg -ErrorAction SilentlyContinue){ rg -n "DINK_COPY_PASTE|Universal No-Items|Workspace And CLI|Machine Checklist|Success Definition|What It Does Not Do" .\DINK_PULL_MACHINE_READINESS_FROM_GITHUB_PACKET_20260711.md .\AEYE_MACHINE_SINGLE_COMMAND_20260711.md .\AEYE_MACHINE_CREDENTIAL_BASELINE_20260711.md .\AEYE_WORKSPACE_AND_CLI_BASELINE_20260711.md .\PASSWORD_CHECKLIST_ACTIVE_QUEUE_20260711.md 2>$null }; powershell -NoProfile -ExecutionPolicy Bypass -File .\Invoke-AeyeMachineReadiness.ps1 -Nickname $N
```

Machine nickname examples:

- Betsy: `$N="Betsy"`
- Spanzee: `$N="Spanzee"`
- Medullina: `$N="Medullina"`
- Doss: `$N="Doss"`

## What The Wrapper Runs

The wrapper runs:

- `Test-AeyeMachineCredentialBaseline.ps1`
- `Test-AeyeWorkspaceCliBaseline.ps1`

It writes:

- credential baseline receipt
- workspace/CLI baseline receipt
- combined summary receipt

Default destination:

- `C:\Users\<current user>\Documents\1password Project\Receipts`

## Return Readback

Return exactly this shape:

```text
DINK_MACHINE_READINESS_RESULT
machine_nickname:
hostname:
summary_receipt:
summary_sha256:
credential_status:
workspace_cli_status:
blockers:
credential_receipt:
workspace_cli_receipt:
packet_source:
```

## Success Definition

Success is not "the machine is perfect."

Success is:

- the target host proved itself
- the machine-readiness files were pulled from GitHub
- one wrapper ran locally
- one combined summary receipt exists
- no secrets or auth-status commands were run
- blockers are concrete enough for the next Dink packet

## If It Fails

If GitHub fetch fails:

- report `BLOCKER=GITHUB_PACKET_PULL_FAILED`
- include whether a local Werkles repo existed
- include the git error text

If the project folder is missing:

- the command creates `Documents\1password Project`

If the wrapper fails:

- return `BLOCKER=READINESS_WRAPPER_FAILED`
- include stdout/stderr

## Boundary

This packet contains no passwords, OTP seeds, passkeys, recovery codes, Secret Keys, tokens, banking numbers, card numbers, SSNs, or secret answers.
