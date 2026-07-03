# APPROVAL_FATIGUE_REDUCTION_REPORT.md

Date: 2026-06-17
Machine: Betsy
System: Automatica Policy Registry V1
Registry: `foreman/soledash/AUTOMATICA_APPROVALS.json`
Inventory: `foreman/soledash/PERMISSION_FLY_INVENTORY.md`

## Target

Reduce Ben-facing approval interruptions:

`60 approvals/day -> 5 approvals/day`

## Method

Start from Bean's Top 20 recurring approval flies, then classify each fly through Automatica:

- GREEN: automated, no Ben interruption.
- BLUE: automated with receipt.
- RED: still interrupts Ben every time.

No blanket approval is given to secrets, production deploys, public exposure, payments, banking, DNS, legal documents, account ownership, OAuth, or destructive data actions.

## Summary

| Metric | Count |
|---|---:|
| Baseline approvals/day | 60 |
| After Automatica approvals/day | 5 |
| Reduction | 55 |
| Reduction rate | 91.7% |
| Top 20 flies automated | 17 |
| Top 20 flies remaining RED | 3 |

## Bean Top 20 Approval Flies

| # | Approval fly | Class | Automated? | Before/day | After/day | Disposition |
|---:|---|---|---|---:|---:|---|
| 1 | Cursor per-file / agent run-mode approvals | BLUE | Yes | 8 | 0 | Execute approved local agent permission/run-mode changes and receipt. |
| 2 | SoleDash confirmations for GREEN actions | GREEN | Yes | 7 | 0 | Execute class-approved GREEN actions without another Ben prompt. |
| 3 | Terminal elevation for approved local workstation maintenance | BLUE | Yes | 5 | 0 | Execute only approved local maintenance and receipt; secrets/installs/security still stop. |
| 4 | Local status/readback collection | GREEN | Yes | 4 | 0 | Machine readbacks, status collection, and workstation audits auto-run. |
| 5 | Packet and receipt generation confirmations | GREEN | Yes | 4 | 0 | Packets and receipts write without pre-approval prompts. |
| 6 | Port Collision Override | BLUE | Yes | 3 | 0 | Use next approved localhost port and receipt; do not kill unknown processes. |
| 7 | Dependency Sync from existing lockfiles | BLUE | Yes | 3 | 0 | Sync from existing manifests/lockfiles and receipt; new package choices remain RED. |
| 8 | Startup app, launcher, and workspace restore confirmations | BLUE | Yes | 3 | 0 | Apply approved startup/workspace restore changes and receipt. |
| 9 | Browser session restoration | BLUE | Yes | 3 | 0 | Restore approved local browser sessions and receipt. |
| 10 | PowerToys validation / FancyZones updates | BLUE | Yes | 3 | 0 | Validation is GREEN; layout/startup changes execute with receipt. |
| 11 | Repo search and local file reads | GREEN | Yes | 2 | 0 | Search/read actions do not require Ben approval. |
| 12 | SSH/RDP reachability probes | GREEN | Yes | 2 | 0 | Probe reachability automatically; credentials and unknown trust prompts remain RED. |
| 13 | 15-Minute Stale Queue Drop | BLUE | Yes | 2 | 0 | Archive/drop stale non-RED queue items after 15 minutes and receipt. |
| 14 | Formatting Enforcement | BLUE | Yes | 2 | 0 | Apply repo-standard formatting to touched files and receipt. |
| 15 | Pre-Commit Janitor | BLUE | Yes | 2 | 0 | Run checks and cleanup prep only; no stage/commit/push/switch/merge. |
| 16 | Silent Success Logging and Tier 2/Tier 3 aggregation | GREEN | Yes | 1 | 0 | Log successes and aggregate non-blocking errors without interrupting Ben. |
| 17 | Idle UI takedown, strict mobile ambient default, mobile receipt truncation, Ghost Protocol | GREEN/BLUE | Yes | 1 | 0 | Quiet non-active UI and ghost/simulated state; BLUE ghost cleanup receipts. |
| 18 | Google Drive OAuth, account access, items removed, or cloud file changes | RED | No | 2 | 2 | Must interrupt because cloud identity/data can change. |
| 19 | Local firewall inbound/public exposure prompts | RED | No | 1 | 1 | Must interrupt because local services may become exposed. |
| 20 | Production deploy, git push/merge, secrets, account ownership, payments/banking/DNS/legal | RED | No | 2 | 2 | Must interrupt because shared state, money, identity, legal, or production can change. |

## Automated

Automated approvals/day removed: 55.

Automated fly classes:

- Cursor local agent/run-mode loops.
- SoleDash GREEN confirmation loops.
- Terminal elevation for approved local workstation maintenance.
- Local health/status/readback collection.
- Packet and receipt generation.
- Localhost port collision override.
- Dependency sync from existing lockfiles.
- Startup app, launcher, and workspace restore.
- Browser session restoration.
- PowerToys validation and approved FancyZones updates.
- Repo search and local file reads.
- SSH/RDP reachability probes.
- 15-minute stale queue drop.
- Formatting enforcement.
- Pre-commit janitor checks.
- Silent success logging and Tier 2/Tier 3 aggregation.
- Idle UI/mobile quiet defaults/receipt truncation/Ghost Protocol.

## Still RED

Remaining Ben-facing approvals/day: 5.

RED gates that still stop:

- Google Drive OAuth, account access, item removal, or cloud data changes.
- Local firewall inbound/public exposure.
- Production deploy, git push/merge, secrets, account ownership, payments, banking, DNS, and legal documents.

## Acceptance

Machine should stop asking Ben for approved low-risk repeated actions.

RED gates still stop.

BLUE actions execute and receipt.

Target met: `60/day -> 5/day`.
