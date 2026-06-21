# PERMISSION_FLY_INVENTORY.md

Date: 2026-06-17
Machine: Betsy
Project: Permission Fly Swatter
Owner: Dink

## Mission

Reduce recurring approval interruptions by 80% by separating routine workstation actions from true human gates.

## Classification Rule

GREEN means execute automatically after class approval and do not interrupt Ben.

BLUE means execute automatically after class approval and write a receipt.

RED means interrupt Ben every time.

Default for anything not listed is RED.

## Inventory

| Source | Frequency | Reason | Classification | Can be pre-approved? | Owner |
|---|---:|---|---|---|---|
| Windows UAC prompts | Medium-high during workstation setup | Admin elevation is needed for local workstation configuration; unknown installers and security changes remain sensitive. | BLUE | Yes, only for approved local workstation tasks with receipt; unknown installers stay RED. | Dink |
| Google Drive | Medium | OAuth, account access, file movement, or "items removed" prompts can affect cloud data and identity. | RED | No blanket pre-approval. Session/status checks can be handled separately, but account or file decisions must interrupt. | Ben / Dink |
| PowerToys | Medium | Validation is routine, but FancyZones or startup integration changes alter workstation behavior. | BLUE | Yes, for approved PowerToys layout/startup changes with receipt; validation is GREEN. | Dink |
| Cursor | High | Agent run mode, allowlist prompts, and per-file approval loops create repeated friction during build work. | BLUE | Yes, for approved local agent permission/run-mode changes with receipt; auth/secrets remain RED. | Dink / Maker |
| VS Code | Medium | Workspace trust, extension prompts, and restore prompts can repeat across repo windows. | BLUE | Yes, for workspace/session restore and local trust prompts with receipt; extension installs remain RED unless separately approved. | Dink |
| GitHub Desktop | Medium | App prompts often appear around auth, publish, push, or repo ownership operations. | BLUE | Yes for local session/workspace restore with receipt; push/publish/auth/account changes remain RED. | Dink / Petra |
| Browser permission prompts | Medium-high | Camera, microphone, location, notification, password, and session prompts can touch identity or user privacy. | RED | No for sensitive browser permissions; browser session restoration can be BLUE. | Ben / Dink |
| Local firewall prompts | Medium | Inbound rules and public network access can expose local services. | RED | No blanket pre-approval. Local status checks are GREEN; opening inbound/public access must interrupt. | Dink |
| SSH prompts | Medium | Reachability probes are routine, but host trust, passwords, and private keys change security posture. | BLUE | Yes for known-host/approved fleet trust with receipt; passwords, keys, and unknown fingerprints are RED. | Dink |
| Terminal elevation prompts | High | Repeated admin terminal requests interrupt workstation setup and diagnostics. | BLUE | Yes, for approved local workstation maintenance with receipt; secrets, installs, and security changes remain RED. | Dink |
| Startup confirmations | Medium | Startup app, launcher, and workspace restore prompts repeat after reboot or app launch. | BLUE | Yes, with receipt for startup app changes and workspace restore. | Dink |
| SoleDash confirmations | High | Routine SD confirmations can become artificial friction when the action is already class-approved. | GREEN | Yes for GREEN classes; BLUE executes and receipts; RED stays visible. | Dink / Petra |

## Top 10 Approval Flies by Annoyance Score

| Rank | Approval fly | Source | Class | Annoyance score | Why it hurts |
|---:|---|---|---|---:|---|
| 1 | Cursor per-file or allowlist loops | Cursor | BLUE | 10 | Blocks flow inside the main build surface even after Ben has approved the class of work. |
| 2 | Terminal elevation loops | Terminal elevation prompts | BLUE | 9 | Repeats during local workstation setup and creates stop-start execution. |
| 3 | Windows UAC for approved local workstation tasks | Windows UAC prompts | BLUE | 9 | Same category as terminal elevation; should receipt rather than repeatedly ask for routine local changes. |
| 4 | Google Drive "Items Removed" or OAuth prompts | Google Drive | RED | 8 | High interruption cost, but cloud data/account scope means it must stay a true gate. |
| 5 | Browser camera, mic, location, password, or notification prompts | Browser permission prompts | RED | 8 | Can affect identity/privacy and should not be hidden behind broad approval. |
| 6 | Startup app and restore confirmations | Startup confirmations | BLUE | 7 | Reappears after reboot and should be handled as execute-and-receipt once approved. |
| 7 | PowerToys / FancyZones update confirmations | PowerToys | BLUE | 7 | Necessary for workstation uniformity; should not require repeated Ben clicks after class approval. |
| 8 | GitHub Desktop push, publish, or auth prompts | GitHub Desktop | RED | 7 | Local restore is routine, but remote/account actions change shared state and should interrupt. |
| 9 | Local firewall inbound/public prompts | Local firewall prompts | RED | 6 | Public exposure risk outweighs annoyance; keep visible every time. |
| 10 | SoleDash confirmations for GREEN actions | SoleDash confirmations | GREEN | 6 | Fake friction: if a command is already GREEN, SD should execute without another confirmation. |

## Implementation Target

GREEN flies should never ask Ben again.

BLUE flies should execute and produce a receipt.

RED flies should interrupt Ben every time.

Anything not on the allow list stays RED.
