# THUFIR_STACK_AUDIT.md

Date: 2026-06-17
Machine: Betsy
Hostname evidence: `DESKTOP-KTBH0LA` per `foreman/BETSY_BASELINE_v1.md`
Reviewer: Petra
Decision Owner: Ben
Return Destination: Workstation 2.0 Queue

## Audit Result

| Field | Result |
|---|---|
| Installed | yes |
| Version | 1.6.0 from `C:\Users\Ben Leak\AppData\Local\perplexity-updater\installer.exe` metadata |
| Launch path | `C:\Users\Ben Leak\AppData\Local\Programs\Perplexity\Perplexity.exe` |
| Start Menu shortcut | `C:\Users\Ben Leak\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Perplexity.lnk` |
| Login status | logged in |
| Operational status | running on Betsy during audit |
| Parity status vs Doss/Sally | partial / not fully proven |

## Required Audit Questions

| Question | Answer | Evidence |
|---|---|---|
| Is Perplexity Desktop installed on Betsy? | yes | `Test-Path` passed for `C:\Users\Ben Leak\AppData\Local\Programs\Perplexity\Perplexity.exe`; file size 211,212,640 bytes; modified 2026-03-11. |
| Is Perplexity Desktop logged in and operational? | yes | Active `Perplexity` processes observed; app state exists under `C:\Users\Ben Leak\AppData\Roaming\Perplexity`; `config.json` records `hasLaunchedEver: true`; Network Cookies and session/local storage files present. No cookie/token contents were read. |
| Is Thufir launch path documented? | yes | Added to `foreman/WORKSTATION_2_0_STACK.md`. |
| Is Thufir included in startup/recovery procedures? | yes | Added to `foreman/WORKSTATION_2_0_STACK.md` startup/recovery procedure. |
| Is Thufir included in Aeye Uniformity checklist? | yes | Added to `foreman/WORKSTATION_2_0_STACK.md` Aeye Uniformity checklist. |

## Process Evidence

Observed running Perplexity processes on Betsy:

- `Perplexity` with executable path `C:\Users\Ben Leak\AppData\Local\Programs\Perplexity\Perplexity.exe`
- Additional Perplexity helper processes without path exposed by PowerShell

## Shortcut Evidence

Start Menu shortcut exists:

`C:\Users\Ben Leak\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Perplexity.lnk`

Shortcut metadata note:

- `IconLocation` and `WorkingDirectory` point to `C:\Users\Ben Leak\AppData\Local\Programs\Perplexity`.
- `TargetPath` reported through this sandbox as `C:\Users\CodexSandboxOffline\AppData\Local\Programs\Perplexity\Perplexity.exe`, while the real Betsy executable path exists under Ben's profile. Treat the real executable path as canonical for Workstation 2.0.

## Parity Status

| Machine | Status |
|---|---|
| Betsy | PASS for Thufir desktop install, launch path, running app, and login-state evidence. |
| Sally | PARTIAL: existing repo docs include Perplexity as Edge Crew Bay tab 5 / Computer, but no live Sally Perplexity Desktop install audit is present in this run. |
| Doss | UNKNOWN: `foreman/MACHINE_TOPOLOGY.md` marks Doss physical machine identity as unresolved; no Doss Perplexity Desktop audit is on record. |

## Notes

- Perplexity Desktop updater metadata file `app-update.yml` is present but does not expose an app version; it records `channel: latest`, provider `generic`, and updater cache `perplexity-updater`.
- Version `1.6.0` comes from the local Perplexity updater installer metadata.
- No credentials, cookies, tokens, or session contents were read or recorded.
- No workstation settings were changed.
