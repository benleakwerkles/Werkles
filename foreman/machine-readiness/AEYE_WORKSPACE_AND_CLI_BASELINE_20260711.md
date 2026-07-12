# Aeye Workspace And CLI Baseline - 2026-07-11

Mode: workstation readiness, no secrets, mule-reduction baseline

## Purpose

This rolls password cleanup, Workspace setup, browser setup, and CLI readiness into one per-machine standard.

The point is not to inventory every app on Windows. The point is to prove the tools that reduce mulework:

- launch the right workspace
- open the right browser profile
- use the right 1Password account/vault
- run the right repo/CLI commands
- avoid repeated auth prompts
- produce receipts without secrets

## Golden Rule

Each machine proves itself locally.

Doss cannot prove Betsy, Spanzee, Medullina, Sally, or any other Handeye. Every machine needs its own receipt.

## What Goes In This Thing

### 1. Host Identity

Record:

- machine nickname
- hostname
- Windows user
- user profile path
- current directory
- PowerShell version
- timestamp

Stop if the host does not match the intended machine.

### 2. Workspace / Window Setup

Record:

- PowerToys installed/present
- PowerToys Workspaces enabled/present
- FancyZones present if used
- saved Workspaces/logs present
- intended launch set for that machine

Standard launch set for password/workstation cleanup:

- 1Password desktop
- Chrome active cleanup profile
- PowerShell / Windows Terminal
- Codex or the local agent surface
- Cursor or VS Code when repo work is assigned
- Werkles checkout when present
- local relay/Harvey surfaces when present

Do not claim Workspaces is configured from a generic settings file alone. Prefer a saved workspace artifact or PowerToys Workspaces log evidence.

### 3. Browser / Autofill Setup

For each Chrome profile used for cleanup:

- 1Password extension installed
- extension unlock/account/vault visibility verified by UI
- Google Password Manager saving/filling disabled
- Google passkey/autofill conflicts disabled where needed
- provider tests use extension popup search, not only inline field icons

If a profile lacks the 1Password extension, it is not a password-cleanup profile until fixed.

### 4. 1Password Setup

Record:

- 1Password desktop detected through Start Apps / Appx / winget
- 1Password desktop unlock status by human-visible UI, not by reading secrets
- Settings > Browser integration enabled
- Settings > Security > Windows Hello/system unlock enabled where available
- Settings > Developer > Integrate with 1Password CLI enabled only for operator stations
- `op` CLI present and version

Do not run `op account list` or `op whoami` in the general baseline. Those are operator-worker checks only.

### 5. Git / GitHub Setup

Record:

- `git` present
- `gh` present
- local Werkles checkout paths
- branch / HEAD / origin / compact dirty status for known checkouts

Do not run `gh auth status` in the general baseline. It can be a human/auth gate and belongs to a provider-specific packet.

### 6. Core Runtime CLIs

Record presence/version where safe:

- PowerShell / `pwsh`
- `winget`
- `git`
- `gh`
- `op`
- `node`
- `npm` and `npm.cmd`
- `corepack`
- `pnpm`
- `yarn`
- `python`
- `py`
- `pip`
- `uv`
- `ssh`

On Windows, prefer `npm.cmd` in automation because PowerShell execution policy can block `npm.ps1`.

### 7. App / Provider / Deploy CLIs

Record presence only or version if safe:

- `codex`
- `openai`
- `vercel`
- `supabase`
- `stripe`
- `firebase`
- `netlify`
- `wrangler`
- `docker`
- `wsl`
- `gcloud`
- `aws`
- `az`
- `playwright`

Do not log in, initialize, deploy, pull secrets, or run provider auth commands from the baseline.

### 8. Editor / Agent Surfaces

Record presence:

- Codex app/thread surface if relevant
- Cursor
- VS Code
- GitHub Desktop
- local Harvey worker scripts
- local relay folders
- speaker/headphone notification lane if this machine owns audio alerts

### 9. Remote / Relay Setup

Record presence only:

- RustDesk app/config presence
- SSH service/client presence
- RDP availability only if already enabled
- relay receiver folders/receipts
- machine-specific target binding if already proven

Do not expose unattended access passwords, RustDesk passwords, tokens, or relay secrets. Location-only pointers such as `Ben vault` are acceptable.

### 10. Hardware / Human Gates

Record presence/status only:

- YubiKey/security key devices visible
- Windows Hello available/enabled by UI
- whether the machine is allowed to be an operator station

Device presence is not provider enrollment proof.

## Machine Roles

| Role | Needs Workspaces | Needs `op` | Needs `gh` | Needs browser cleanup | Notes |
| --- | --- | --- | --- | --- | --- |
| Hub / Operator | Yes | Yes | Yes | Yes | Doss by default unless moved |
| Browser Tester | Optional | No | Optional | Yes | best for login/autofill checks |
| Repo Worker | Yes | Optional | Yes | Optional | needs canonical repo checkout |
| Family Access Check | No | No | No | Optional | checks shared vault visibility |
| Relay / Audio | Optional | No | No | Optional | proves receipt/audio path |

## Standard Read-Only Verifier

Use:

- `Test-AeyeWorkspaceCliBaseline.ps1`

For the normal machine setup run, prefer the wrapper:

- `Invoke-AeyeMachineReadiness.ps1`

The wrapper runs both the credential baseline and the workspace/CLI baseline and writes a combined summary receipt.

Run:

```powershell
cd "C:\Users\BenLeak\Documents\1password Project"
powershell -NoProfile -ExecutionPolicy Bypass -File .\Test-AeyeWorkspaceCliBaseline.ps1 -Nickname Doss
```

For machines where the Windows user folder has a space:

```powershell
cd "C:\Users\Ben Leak\Documents\1password Project"
powershell -NoProfile -ExecutionPolicy Bypass -File .\Test-AeyeWorkspaceCliBaseline.ps1 -Nickname Betsy
```

## Success Definition

A machine is workspace/CLI ready when:

- host identity is proven
- workspace launch/layout tooling is detected or explicitly not required
- active Chrome profile has 1Password extension and Google Password Manager conflicts disabled
- 1Password desktop browser integration is enabled
- relevant CLIs are present for that machine's role
- local Werkles checkout state is known if repo work is assigned
- auth-sensitive commands are not run by the baseline
- receipt is written with no secrets

## Boundary

This packet contains no passwords, OTP seeds, passkeys, recovery codes, Secret Keys, tokens, bank numbers, card numbers, SSNs, or secret answers.
