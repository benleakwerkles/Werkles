# Dink@Betsy Relay Project Handoff Packet

Status: ACTIVE HANDOFF
Issued: 2026-07-03
Audience: Dink@Betsy, or any substitute Dink asked to hold the relay lane while Swanson moves to password cleanup
Canonical repo: https://github.com/benleakwerkles/Werkles.git
Canonical local checkout: C:\Users\<user>\github\Werkles
Human gate: Ben ordered a durable handoff because relay proof context has become too dense to trust chat memory alone.

## Plain Mission

You are taking over relay stewardship, not password cleanup.

Your job is to preserve the receiver-side proof chain:

```text
packet created -> queued/sent -> RECEIVED -> COMPLETED or BLOCKER -> status readback -> origin dash answer/readback
```

The mistake that keeps trying to sneak back in is calling sender-side movement "done." Do not do that. `SENT`, `QUEUED`, `SENT_TO_CODEX_THREAD`, and file placement are transport state only. They are not delivery proof.

## Project Split Decision

PASSWORD_CLEANUP_PROJECT_SEPARATION: REQUIRED

Start a new Codex project/thread for passwords and 1Password cleanup.

Do not run password cleanup inside a relay test thread. Do not use relay packet history as working memory for account-security work. Do not paste passwords, MFA codes, recovery codes, tokens, account numbers, routing numbers, Plaid/QBO/OAuth tokens, or 1Password item secrets into chat, repo files, receipts, packets, screenshots, or handoffs.

Allowed for the password/1Password project:

- Vault/location pointers such as `Ben vault`, if Ben approves that label.
- Account/item names when needed for inventory.
- Redacted masks or last-four values only when necessary.
- Status fields such as `KNOWN`, `MISSING`, `DUPLICATE`, `ROTATION_NEEDED`, `MFA_HUMAN_GATE`, or `BLOCKED`.
- Operator instructions that say Ben must handle login, MFA, export approval, or final account changes.

Forbidden for the password/1Password project:

- Secret values.
- Recovery-code contents.
- OAuth/Plaid/QBO tokens.
- Password exports committed to git.
- Any relay test artifact that contains unrelated project chatter.

Reason: this thread family is saturated with relay state. Password cleanup deserves a clean, narrow context with no accidental relay proof noise and no secrets in durable artifacts.

## First Action On Any Machine

Do this before editing, deleting, moving, archiving, or declaring anything clean:

```powershell
cd C:\Users\<user>\github\Werkles
git pull --ff-only origin main
Get-Content foreman\messages\DINK_BETSY_RELAY_PROJECT_HANDOFF_PACKET_20260703.md
Get-Content foreman\messages\DINK_MASHEEN_WERKLES_LOCAL_CLOUD_CLEANUP_PACKET_20260702.md
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Inventory-WerklesLocalSources.ps1 -ScanDepth 4
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Assert-WerklesCanonical.ps1
```

If the canonical checkout does not exist yet, do not guess. Inventory the probable dirty roots first using the manual dirty-root commands in `foreman/messages/DINK_MASHEEN_WERKLES_LOCAL_CLOUD_CLEANUP_PACKET_20260702.md`, then clone or move only after salvage evidence is preserved.

## Required Source Files To Read

Read these from the canonical repo before taking relay action:

1. `source-truth-plan/AEYE_RELAY_CONTRACT_V0.md`
2. `source-truth-plan/references/swanson_relay_build_20260629/README.md`
3. `source-truth-plan/references/swanson_relay_build_20260629/contracts/THINKIT_RELAY_MERGE_HANDOFF.md`
4. `source-truth-plan/references/swanson_relay_build_20260629/contracts/THINKIT_RELAY_MERGE_CONTRACT.json`
5. `source-truth-plan/references/swanson_relay_build_20260629/receipts/SWANSON_DOSS_THINKIT_RELAY_MERGE_PREP_RECEIPT_20260629.json`
6. `data/thinkit/thinkit_status.md`
7. `scripts/foreman/command-dash-relay-status.mjs`
8. `scripts/foreman/relay-courier-lib.mjs`
9. `foreman/messages/DINK_MASHEEN_WERKLES_LOCAL_CLOUD_CLEANUP_PACKET_20260702.md`
10. `scripts/foreman/Inventory-WerklesLocalSources.ps1`
11. `scripts/foreman/Assert-WerklesCanonical.ps1`
12. `scripts/foreman/Install-WerklesGitGuard.ps1`

Do not use this packet as a substitute for those files. This packet is the operator handoff. The listed files are the source references.

## Canonical Names

Official names from the relay snapshot:

| Thing | Canonical name |
|---|---|
| Incoming command dash | Feral Membrane Main Dash |
| Incoming command dash owner | Dink@Betsy |
| Relay module | Swanson Relay Build |
| Relay module owner | Swanson@Doss |
| Merged main surface | ThinkIt |

ThinkIt may use the Swanson Relay Build only if the UI preserves receiver proof. Button click, packet creation, queue state, and sent state are not enough.

## Live Surfaces To Re-Read

These are LAN/local surfaces and may be stale, offline, blocked, or moved. Re-read them live before claiming current state.

Relay receiver standing inbox pattern:

```text
http://10.1.10.8:3339/aeye/<Aeye.Machine>
http://10.1.10.8:3339/v1/aeye/<Aeye.Machine>/inbox
```

Relay and Brainboot status:

```text
http://10.1.10.8:3339/v1/relay/status?limit=50
http://10.1.10.8:3339/v1/brainboot/status?limit=50
http://10.1.10.8:3339/v1/relay/thread_bridge/status
http://10.1.10.8:3339/v1/relay/coverage
http://10.1.10.8:3339/v1/relay/origin_return
http://10.1.10.8:3339/v1/relay/actionable_returns
```

ThinkIt last-known surface:

```text
http://10.1.10.8:3342/thinkit
```

Dink-specific first stops:

```text
http://10.1.10.8:3339/aeye/Dink.Betsy
http://10.1.10.8:3339/v1/aeye/Dink.Betsy/inbox
http://10.1.10.8:3339/v1/relay/status?limit=50
```

Current useful inboxes listed in the contract:

```text
http://10.1.10.8:3339/aeye/Skybro.Betsy
http://10.1.10.8:3339/aeye/Petra.Betsy
http://10.1.10.8:3339/aeye/Swanson.Doss
http://10.1.10.8:3339/aeye/Fucko.Betsy
```

If browser navigation is blocked by the local browser, use PowerShell:

```powershell
Invoke-RestMethod -Uri "http://10.1.10.8:3339/v1/relay/status?limit=50"
Invoke-RestMethod -Uri "http://10.1.10.8:3339/v1/aeye/Dink.Betsy/inbox"
```

## Receiver Proof Procedure

For every relay packet:

1. Open the standing inbox or token-bearing receiver URL directly.
2. Do not ask Ben to paste the packet.
3. Read the packet metadata:
   - packet id
   - target
   - packet title
   - current status
   - receiver URL
   - ack token, if exposed
   - home-thread continuity fields, if present
4. Write `RECEIVED` first.
5. Then write `COMPLETED` or `BLOCKER`.
6. Include evidence text for `COMPLETED` or `BLOCKER`.
7. Re-read `/v1/relay/status` or `/v1/brainboot/status`.
8. Re-read the standing inbox page or JSON inbox.
9. If the packet is meant to return to ThinkIt/origin dash, re-read origin return.
10. Return the proof block with exact receipt ids, paths, hashes, status, and blockers.

The valid relay state sequence is:

```text
SENT_UNACKNOWLEDGED -> RECEIVED_NOT_COMPLETED -> COMPLETED_RECEIPT_PROVEN
SENT_UNACKNOWLEDGED -> RECEIVED_NOT_COMPLETED -> BLOCKER_RECEIPT_PROVEN
```

Do not close a packet from the POST response alone. A successful POST says the write probably happened. It is not the final proof. The final proof is the status/inbox readback.

## POST Ack Shape

Use the UI buttons if available. If a direct API write is required, preserve the same fields:

```json
{
  "packet_id": "<packet id>",
  "ack_token": "<ack token from receiver packet>",
  "status": "RECEIVED",
  "receiver": "Dink.Betsy",
  "evidence": ""
}
```

Then:

```json
{
  "packet_id": "<packet id>",
  "ack_token": "<ack token from receiver packet>",
  "status": "COMPLETED",
  "receiver": "Dink.Betsy",
  "evidence": "What was actually done, what file or endpoint proved it, and what remains."
}
```

Or:

```json
{
  "packet_id": "<packet id>",
  "ack_token": "<ack token from receiver packet>",
  "status": "BLOCKER",
  "receiver": "Dink.Betsy",
  "evidence": "Exact blocker, exact surface checked, and the smallest next action."
}
```

Typical endpoints:

```text
POST http://10.1.10.8:3339/v1/relay/ack
POST http://10.1.10.8:3339/v1/brainboot/ack
```

## Required Relay Readback Block

Return this block after each packet or after each handoff status check:

```text
HANDOFF_PACKET: DINK_BETSY_RELAY_PROJECT_HANDOFF_PACKET_20260703
TARGET:
PACKET_ID:
PACKET_TITLE:
RECEIVER_SURFACE:
RECEIVED_RECEIPT_ID:
RECEIVED_RECEIPT_PATH:
RECEIVED_RECEIPT_SHA256:
TERMINAL_RECEIPT_KIND: COMPLETED|BLOCKER
TERMINAL_RECEIPT_ID:
TERMINAL_RECEIPT_PATH:
TERMINAL_RECEIPT_SHA256:
FINAL_STATUS:
STATUS_READBACK_SOURCE:
ORIGIN_RETURN_STATUS:
ORIGIN_RETURN_READBACK_SOURCE:
HOME_THREAD_REUSE_REQUIRED:
HOME_THREAD_SEND_VERIFIED:
POSTED_THREAD_ID:
WHAT_CHANGED:
WHAT_IS_BLOCKED:
WHAT_THINKIT_SHOULD_DECIDE_NEXT:
PROOF_BOUNDARY:
NEXT_ACTION:
```

If there is no packet to ack, return:

```text
HANDOFF_PACKET: DINK_BETSY_RELAY_PROJECT_HANDOFF_PACKET_20260703
TARGET:
RECEIVER_SURFACE:
INBOX_STATE: EMPTY|UNREACHABLE|ERROR
STATUS_READBACK_SOURCE:
LAST_PACKET_SEEN:
LAST_PACKET_FINAL_STATUS:
BLOCKER:
NEXT_ACTION:
```

An empty inbox is not success. It means there is no packet at that receiver surface right now.

## Home-Thread And Lane Rules

If a packet or readback exposes these fields, report them:

```text
HOME_THREAD_REUSE_REQUIRED
home_thread_send_verified
posted_thread_id
home_thread_title
thread_reuse_required
rotation_requires_operator_reason
```

Standing receiver lane reuse is the default. Do not create, bless, or rotate to a new lane just because the first surface looks weird. If the standing lane is degraded, return a blocker like:

```text
BLOCKER: THREAD_ROTATION_REQUIRED
```

Then include the exact evidence. Do not silently rotate.

## Known Lane Cautions

- `Ender.Sally` was held by topology in the Swanson Relay Build snapshot. Do not route work there unless a newer source proves the hold was cleared.
- `Swanson.Doss` is local-only. Do not route it through the Aeye thread bridge.
- `Dink@Betsy` owns the Feral Membrane Main Dash. That does not mean `Dink.Betsy` packets are automatically complete.
- Rename/continuity packets such as `Maker@Betsy -> Crash Davis` prove lane continuity only. They do not prove global registry propagation unless a later source says so.
- `QUEUED_FOR_CODEX_THREAD_SEND`, `SENT_TO_CODEX_THREAD`, and `FILE_INBOX_WAITING_FOR_RECEIVER` are still proof gaps.
- A browser blocker such as `net::ERR_BLOCKED_BY_CLIENT` is a tooling blocker, not a packet result. Try direct PowerShell readback before returning.

## Dirty-Root And Local Repo Rules

Relay work must not restart the old Werkles double-source mess. Every machine must converge to:

```text
C:\Users\<user>\github\Werkles
https://github.com/benleakwerkles/Werkles.git
```

Do not delete unknown work. Preserve divergent work as salvage evidence.

The dirty-root hunt must include at least:

```text
C:\Users\<user>\github\Werkles
C:\Users\<user>\github\Werkles1
C:\Users\<user>\Desktop\github\Werkles
C:\Users\<user>\Desktop\github\Werkles1
C:\Users\<user>\Desktop\Werkles_DIRTY_BACKUP
C:\Users\<user>\Documents\Werkles
C:\Users\<user>\Documents\GitHub\Werkles
C:\Users\<user>\Source\Werkles
C:\Users\<user>\repos\Werkles
C:\Users\<user>\dev\Werkles
C:\Dev\Werkles
C:\Dev\Werkles1
C:\wt\Werkles
C:\wt\stbook
C:\speaker
C:\tinkarden
C:\TinkerDen
```

Known historically important root suspects:

| Path | Why it matters |
|---|---|
| `C:\Users\BenLeak\Desktop\github\Werkles` | Prior active/dirty Werkles root possibility, especially on Betsy. |
| `C:\Users\benle\Desktop\github\Werkles` | Same suspect with alternate user spelling. |
| `C:\Users\benle\Desktop\github\Werkles1` | App-only mirror / separate repo in prior forensic readbacks. |
| `C:\Users\benle\Desktop\Werkles_DIRTY_BACKUP` | Known dirty backup name; archive only unless reviewed file by file. |
| `C:\Users\benle\Documents\Werkles` | Known stale partial copy outside the GitHub path. |
| `C:\Dev\Werkles` | Sally-style second same-host source surface. |
| `C:\wt\stbook` | Source-truth/book working tree handle; not disposable clutter. |
| `C:\speaker` | Relay/source-truth runtime root; not a Werkles replacement, not safe to delete/import wholesale. |
| `C:\tinkarden` / `C:\TinkerDen` | Command surface runtime roots; inventory only, do not commit wholesale. |

The inventory helper writes a receipt under:

```text
C:\Users\<user>\github\Werkles-local-merge-receipts
```

If a duplicate checkout has unique commits:

```powershell
git -C C:\Users\<user>\github\Werkles remote add salvage-local <duplicate-folder-path>
git -C C:\Users\<user>\github\Werkles fetch salvage-local
git -C C:\Users\<user>\github\Werkles branch salvage/local-folder-merge/<machine>/<folder>/<branch>-YYYYMMDD salvage-local/<branch>
git -C C:\Users\<user>\github\Werkles remote remove salvage-local
```

If a duplicate checkout has dirty or untracked work:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$out = "$env:USERPROFILE\github\Werkles-local-merge-receipts\$env:COMPUTERNAME-$stamp"
New-Item -ItemType Directory -Force -Path $out | Out-Null
git -C <duplicate-folder-path> status -sb | Out-File "$out\status.txt"
git -C <duplicate-folder-path> diff | Out-File "$out\worktree.patch"
git -C <duplicate-folder-path> ls-files --others --exclude-standard | Out-File "$out\untracked.txt"
```

Do not merge salvage branches into `main` without a new human gate.

## Required Local Cleanup Readback Block

When this handoff includes a machine cleanup pass, return:

```text
MACHINE:
HOSTNAME:
CANONICAL_PATH:
CANONICAL_REMOTE:
BRANCH:
HEAD:
WORKTREE_STATUS:
INVENTORY_RECEIPT:
DIRTY_ROOT_SCAN:
DIRTY_ROOTS_FOUND:
GUARD_RECEIPT:
GUARD_INSTALLED:
DUPLICATE_PATHS_RETIRED:
LOCAL_FOLDER_CLASSIFICATIONS:
LOCAL_ONLY_BRANCHES:
SALVAGE_BRANCHES_CREATED:
PATCH_RECEIPTS_CREATED:
BLOCKERS:
```

No machine is clean until exactly one active Werkles folder remains and its remote is `https://github.com/benleakwerkles/Werkles.git`.

## Forward Guardrails

After convergence on every workstation:

```powershell
cd C:\Users\<user>\github\Werkles
git pull --ff-only origin main
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Assert-WerklesCanonical.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Install-WerklesGitGuard.ps1
```

Equivalent npm commands:

```powershell
npm.cmd run guard:werkles
npm.cmd run guard:werkles:install
```

The guard must block future pushes from:

```text
C:\Users\<user>\github\Werkles1
C:\Users\<user>\Desktop\github\Werkles
C:\Users\<user>\Desktop\github\Werkles1
C:\Dev\Werkles
C:\Dev\Werkles1
```

The guard must also block active prompt/launcher files that point humans back to retired destinations.

Project guardrails moving forward:

1. Relay proof work stays in a relay/project thread.
2. Password/1Password cleanup starts in a new clean project/thread.
3. Every new handoff packet names its canonical repo, canonical local path, current proof boundary, and required readback block.
4. Every packet that touches files says whether deletion is forbidden, allowed after salvage, or explicitly human-gated.
5. No packet is complete unless the receiving Dink returns artifact-grade proof.
6. No relay packet is complete unless receiver-side `RECEIVED` then `COMPLETED` or `BLOCKER` is read back from status/inbox.
7. No password/security packet may contain secrets, secret screenshots, exported vault contents, or unreconciled account tokens.

## Known Handoff State

This packet was written after the canonical Doss checkout was clean on `main` at pre-packet head:

```text
1d19f64
```

That is a repo state, not live relay health. Live relay health must be checked from the LAN surfaces listed above.

The latest Swanson Relay Build snapshot in repo says:

```text
THINKIT_RELAY_MERGE_READY
routable_targets: 8
round_trip_proven_targets: 8
held_targets: 1
local_only_targets: 1
latest_origin_return_packet: BOOK_CHAPTER_EDIT_SKYBRO.BETSY_20260628232327_C97603B0
latest_origin_return_status: COMPLETED_RECEIPT_PROVEN
latest_origin_return_receipt_sha256: F0847F833BC9187214F94748C7A3BBDDF2CAA41AADDDA5E0C04167D490CFEED2
```

Treat those as snapshot facts from 2026-06-29. They are not proof that the live relay is healthy today.

## Common Failure Modes

| Symptom | Likely mistake | Correct move |
|---|---|---|
| Packet says `SENT_TO_CODEX_THREAD`, and Dink reports success. | Confused transport with delivery. | Re-read receiver inbox/status and require terminal receipt. |
| Ben pasted packet contents into chat. | Ben got made courier again. | Open receiver URL/inbox directly next time and record this as a process defect. |
| Inbox says `No packets for <target>`. | Dink treats empty as completion. | Report `INBOX_STATE: EMPTY` and last status readback. |
| POST `/ack` returns success. | Dink trusts POST response alone. | Re-read `/v1/relay/status` and inbox before closing. |
| Target binding fails after a thread exists. | `target_threads.json` lacks the target or is locked. | Inspect topology map and binding ledger; do not call it packet proof. |
| Two Werkles folders exist. | Cleanup skipped dirty-root hunt. | Stop, inventory, classify, salvage before retirement. |
| Password cleanup starts in relay thread. | Project boundary failed. | Stop and move to a clean password/1Password project. |
| Secret appears in artifact. | Secrets boundary failed. | Treat as incident; remove from artifact history through the proper human-gated process. |

## Starter Message For Dink@Betsy

Paste this to the receiving Dink if needed:

```text
You are Dink@Betsy taking over relay stewardship while Swanson moves to password/1Password cleanup.

Do not handle passwords in this relay thread. Do not ask Ben to paste packets. Do not call SENT success.

Use canonical repo:
https://github.com/benleakwerkles/Werkles.git

Start:
cd C:\Users\<user>\github\Werkles
git pull --ff-only origin main
Get-Content foreman\messages\DINK_BETSY_RELAY_PROJECT_HANDOFF_PACKET_20260703.md
Get-Content source-truth-plan\AEYE_RELAY_CONTRACT_V0.md
Get-Content source-truth-plan\references\swanson_relay_build_20260629\README.md
Get-Content source-truth-plan\references\swanson_relay_build_20260629\contracts\THINKIT_RELAY_MERGE_HANDOFF.md
Get-Content data\thinkit\thinkit_status.md
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Inventory-WerklesLocalSources.ps1 -ScanDepth 4
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Assert-WerklesCanonical.ps1

Then open:
http://10.1.10.8:3339/aeye/Dink.Betsy
http://10.1.10.8:3339/v1/relay/status?limit=50

For every packet, write RECEIVED first, then COMPLETED or BLOCKER, then re-read status/inbox and return the required readback block with exact receipt ids, paths, hashes, and final status.
```

## Final Rule

If you are unsure whether something is proof, it is not proof yet. Re-read the authoritative surface, preserve the evidence, and return the exact blocker instead of smoothing the story.
