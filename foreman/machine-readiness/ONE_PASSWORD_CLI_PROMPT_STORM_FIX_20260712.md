# 1Password CLI Prompt Storm Fix - 2026-07-12

Target: every machine-local Dink / Handeye

Mode: emergency brake for repeated 1Password CLI authorization prompts

## Mission

Stop 1Password CLI prompt storms before any password cleanup or machine-readiness work continues.

This packet exists because repeated short-lived Codex/PowerShell `op` calls can trigger repeated Windows Hello / 1Password authorization prompts. That is not an acceptable operator loop.

## What The Fix Does

Runs:

- `Invoke-1PasswordCliPromptStormFix.ps1`

The script:

- does not call `op`
- stops any live `op.exe` process
- stops only known 1Password worker/audit PowerShell scripts
- writes `.harvey-1password\heartbeat.json` as `DISABLED_CLI_BLOCKED_BY_DEFAULT`
- verifies guarded 1Password scripts contain the fail-closed CLI guard
- writes a redacted receipt under `Documents\1password Project\Receipts`

## What It Does Not Do

It does not:

- read, print, copy, export, or transform passwords
- read, print, copy, export, or transform OTP seeds, passkeys, recovery codes, Secret Keys, tokens, notes, banking numbers, card numbers, SSNs, or secret answers
- run `op account list`
- run `op whoami`
- run any `op` command
- disable the 1Password desktop app
- disable the 1Password browser extension
- remove 1Password from the machine
- mutate 1Password items

## Operator Rule

All project scripts that can call 1Password CLI must fail closed by default.

Allowed CLI path, only when explicitly intended:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Start-Harvey1PasswordWorker.ps1 -Allow1PasswordCli
```

The worker now defaults to idle/no-keepalive mode:

- `KeepAliveSeconds = 0`
- no idle `op whoami` pings
- 1Password CLI is only touched when a real queued job is being processed

or a one-process environment gate:

```powershell
$env:WERKLES_ALLOW_1PASSWORD_CLI="YES"
```

Do not set that environment variable globally.

## DINK_COPY_PASTE

Set the nickname and run this on the target machine.

```powershell
$N="MACHINE_NICKNAME"; $Branch="machine-readiness-packets-20260711"; $Dest=Join-Path $env:USERPROFILE "Documents\1password Project"; New-Item -ItemType Directory -Force -Path $Dest | Out-Null; $Candidates=@("$env:USERPROFILE\github\Werkles","$env:USERPROFILE\Desktop\github\Werkles","C:\Users\BenLeak\github\Werkles","C:\Users\Ben Leak\github\Werkles") | Where-Object { Test-Path -LiteralPath (Join-Path $_ ".git") }; $Repo=$Candidates | Select-Object -First 1; if($Repo){ git -C $Repo fetch origin $Branch; $Ref="origin/$Branch" } else { $Cache=Join-Path $Dest "_werkles_packet_source"; if(Test-Path -LiteralPath $Cache){ git -C $Cache fetch origin $Branch; $Repo=$Cache; $Ref="origin/$Branch" } else { git clone --depth 1 --branch $Branch https://github.com/benleakwerkles/Werkles.git $Cache; $Repo=$Cache; $Ref="HEAD" } }; $Files=@("ONE_PASSWORD_CLI_PROMPT_STORM_FIX_20260712.md","Invoke-1PasswordCliPromptStormFix.ps1","Invoke-Werkles1PasswordWorker.ps1","Start-Harvey1PasswordWorker.ps1","Find-1PasswordPortalItems.ps1","Test-Werkles1PasswordReadiness.ps1","Test-1PasswordDamageAudit.ps1"); foreach($F in $Files){ $Text=git -C $Repo show "$Ref`:foreman/machine-readiness/$F"; if($LASTEXITCODE -ne 0){ throw "Failed to pull $F from $Ref" }; Set-Content -LiteralPath (Join-Path $Dest $F) -Value $Text -Encoding UTF8 }; Set-Location -LiteralPath $Dest; powershell -NoProfile -ExecutionPolicy Bypass -File .\Invoke-1PasswordCliPromptStormFix.ps1 -Nickname $N
```

## Return Readback

Return exactly this shape:

```text
ONE_PASSWORD_CLI_PROMPT_STORM_FIX_RESULT
machine_nickname:
hostname:
status:
op_processes_stopped:
worker_processes_stopped:
guarded_scripts_status:
receipt:
receipt_sha256:
blockers:
packet_source:
```

## Success Definition

Success is:

- prompt-storm fix script pulled from GitHub
- no `op` commands run
- any live `op.exe` process stopped
- known password-worker scripts are stopped
- Harvey worker heartbeat is disabled by default
- guarded scripts report `GUARDED`
- receipt exists and SHA-256 is returned

## Boundary

This packet contains no passwords, OTP seeds, passkeys, recovery codes, Secret Keys, tokens, banking numbers, card numbers, SSNs, or secret answers.
