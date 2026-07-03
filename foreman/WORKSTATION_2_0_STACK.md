# WORKSTATION_2_0_STACK.md

Status: Workstation 2.0 Golden Image specification
Updated: 2026-06-17
Reviewer: Petra
Decision Owner: Ben
Return Destination: Workstation 2.0 Queue

## Required Aeye Layer

Every Workstation 2.0 machine must provide the full Aeye operating layer:

| Aeye | Platform | Required surface | Purpose |
|---|---|---|---|
| Petra | ChatGPT | Browser/app session | Comptroller, priority, GO/NO-GO, gate verdicts |
| Ender | Claude | Browser/app session | Liveability, usability, UX audit |
| Skybro | Gemini | Browser/app session | Strategy, synthesis, research arc |
| Bean | DeepSeek | Browser/app session | Kill test, hostile audit, red-team review |
| Thufir | Perplexity Desktop | Desktop app plus documented fallback web tab | Current-world research, cited external checks, OSINT radar |

Thufir is mandatory. Do not ship a Workstation 2.0 Golden Image without Perplexity Desktop or a recorded blocker.

## Thufir Launch Path

Primary Betsy launch path:

`C:\Users\Ben Leak\AppData\Local\Programs\Perplexity\Perplexity.exe`

Start Menu shortcut:

`C:\Users\Ben Leak\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Perplexity.lnk`

Fallback browser tab already documented in Edge Crew Bay:

`https://www.perplexity.ai/`

## Startup / Recovery Procedure

On workstation boot, restore, or Golden Image recovery:

1. Start SoleDash / Foreman cockpit.
2. Start or verify repo/dev terminal context.
3. Restore Petra, Ender, Skybro, Bean, and Thufir sessions.
4. Verify Thufir by opening Perplexity Desktop from the launch path above.
5. Confirm Perplexity Desktop is logged in or mark `needs login only`.
6. Confirm Thufir route labels resolve as `Thufir` / `Computer` / `Perplexity` without losing the seat.
7. Record any failure in `THUFIR_STACK_AUDIT.md` or the active workstation queue receipt.

## Aeye Uniformity Checklist

For each workstation, record:

| Check | Required |
|---|---|
| Petra available | yes |
| Ender available | yes |
| Skybro available | yes |
| Bean available | yes |
| Thufir / Perplexity Desktop installed | yes |
| Thufir launch path documented | yes |
| Thufir login status recorded as `logged in` or `needs login only` | yes |
| Thufir included in startup/recovery procedure | yes |
| Thufir route alias reconciled with Computer / Perplexity docs | yes |
| Parity against Doss and Sally recorded as proven, partial, or unknown | yes |

## Guardrails

- Do not enter credentials, MFA, passwords, or account recovery data into repo artifacts.
- Do not claim Doss or Sally parity without a live readback or explicit receipt.
- Browser-based Perplexity in Edge Crew Bay is a fallback, not a substitute for the Perplexity Desktop requirement.

## Medullina Auxiliary Forge Gate

Medullina is a requested household machine, not a proven Workstation 2.0 machine yet.

Before Medullina can join the Aeye Workstation loop:

1. Record owner consent state, allowed windows, and resource limits.
2. Capture a first `LOCAL_MEDULLINA_WINDOWS` readback with hostname, Windows user context, repo path, branch, commit, and localhost status.
3. RustDesk unattended access may be verified only after consent; record the RustDesk ID, not the password.
4. Medullina starts as an auxiliary forge only: builds, typechecks, smoke tests, indexing, and non-secret batch work.
5. Medullina must not push, deploy, touch billing, apply SQL, store secrets, read personal user folders, or run spend-bearing jobs unless a later human gate upgrades its role.

Pending setup packet: `foreman/MEDULLINA_ONBOARDING_PACKET.md`.
