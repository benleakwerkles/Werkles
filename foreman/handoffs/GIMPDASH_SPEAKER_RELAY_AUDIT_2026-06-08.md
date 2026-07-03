# GimpDash / Speaker Relay Audit - 2026-06-08

## Status
Initial local audit by Codex Foreman / Dink.

Ben asked Codex to crawl the Werkles GimpDash / Speaker relay system and identify the bug, repair, or disconnect preventing packets from reaching the Aeyes.

## Scope Actually Audited
Audited the repo-local Werkles workspace:

- `AGENTS.md`
- `foreman/ACTIVE_AGENT.md`
- `foreman/NEXT_ACTION.md`
- `foreman/LANES.md`
- `foreman/HUMAN_GATES.md`
- `foreman/BUDGET.md`
- `foreman/platform-instructions/**`
- `foreman/handoffs/**`
- `scripts/setup-ai-platforms.ps1`
- `START_AI_PLATFORM_SETUP.cmd`
- `bellows/**`
- `operator-cockpit/**`

## Hard Findings

1. No repo-local GimpDash or Speaker implementation was found.

Searches for `GimpDash`, `gimp dash`, `Speaker`, `Aeye`, and `Aeyes` returned no local implementation files. The only mention of `Aeye` in this workspace is in the new Maker copy packet.

2. `foreman/AI_COUSINS_PROTOCOL.md` is referenced but missing.

`foreman/HUMAN_GATES.md` says `foreman/AI_COUSINS_PROTOCOL.md` participates in the source-of-truth order if present. It is not present. There is no written protocol for packet routing, status, pickup, acknowledgement, stale packet handling, or agent identity mapping.

3. The repo has an outbox, but no inbox, archive, ack, or status manifest.

Current relay structure under `foreman/` is:

- `foreman/handoffs/`
- `foreman/handoffs/outbox/`

There are no per-agent inboxes, no consumed/archive folder, no current packet pointer, and no acknowledgement record. Packets can be written, but nothing repo-local marks them as delivered, read, superseded, active, or stale.

4. Outbox contains stale packets next to current packets.

Current outbox files:

- `TO_CURSOR_BUILD_NOW.md`
- `TO_CURSOR_ONBOARDING.md`
- `TO_MAKER_ENDER_COPY_PACKET_2026-06-08.md`

`TO_CURSOR_ONBOARDING.md` is superseded by later approvals but still sits in the same outbox as active work. A receiver that simply scans outbox can pick stale instructions.

5. `AGENTS.md` conflicts with the cockpit.

`AGENTS.md` still says:

```text
Cursor / Smart Factory is not approved for real work yet. Cursor's first allowed write lane is only the `ben-sandbox` smoke test described in `foreman/handoffs/outbox/TO_CURSOR_ONBOARDING.md`.
```

Current cockpit files say parallel local build is approved and Cursor can perform real local work inside recorded ownership lanes. Any Aeye that reads `AGENTS.md` first, or treats it as higher authority than cockpit files, can incorrectly stop at the old smoke-test gate.

6. Lane ownership is stale versus actual work performed.

Prior result files say Cursor created or edited:

- `app/**`
- `lib/**`
- `components/**`
- `werkles-api/**`
- `bellows/**`
- `index.html`
- `app.js`
- `styles.css`

But current `foreman/LANES.md` still records Cursor's initial ownership as only:

- `styles.css`
- optional notes under `sandbox/cursor-build-notes/`

The result files explicitly recommend recording `app/**`, `werkles-api/**`, and `bellows/**` lane ownership, but that cockpit repair did not happen. That stale map can prevent agents from acting on packets that target files they believe they are forbidden to edit.

7. This folder is not a git repository.

`git rev-parse --is-inside-work-tree` returned:

```text
fatal: not a git repository (or any of the parent directories): .git
```

Packets written here will not reach other platforms through git sync or remote checkout. They only reach agents that can read this exact local folder, or that receive the packet through another bridge.

8. The AI platform setup script is manual clipboard setup, not packet relay.

`scripts/setup-ai-platforms.ps1` copies static platform instruction shims to the clipboard and opens public platform pages for Ben to paste/save. It does not poll outbox, deliver packets, update project instructions, post into chats, or notify Aeyes.

9. Runtime/tooling health is degraded in this thread.

Observed during the audit:

- PowerShell parallel reads hit timeouts and memory errors.
- `node_repl` failed to start with: `The paging file is too small for this operation to complete.`
- Process listing was blocked with access denied.
- CIM memory telemetry was blocked with access denied.

This matches prior cockpit notes that `node_repl` and Browser plugin bridges were previously failing. Even if the file protocol is fixed, local relay automation may fail until the Codex/Windows runtime bridge is healthy.

## Likely Root Causes

The strongest local diagnosis is not one bug. It is a missing relay contract plus stale source-of-truth drift:

1. Packets are created in `foreman/handoffs/outbox/`, but no repo-local system delivers them to Aeyes.
2. There is no `AI_COUSINS_PROTOCOL.md` defining how GimpDash/Speaker should route packets.
3. Old packets remain in outbox, so packet pickup is ambiguous.
4. `AGENTS.md` contains old Cursor rules that contradict the current cockpit.
5. `LANES.md` does not reflect work already performed by Cursor/Maker-adjacent lanes.
6. The current folder is not git-backed, so packets may be invisible to any agent pointed at a different workspace.
7. Codex local bridge health is still suspect because Node and Browser tooling have failed repeatedly.

## What I Need From Ben To Finish The Repair

1. Confirm the canonical workspace for packet relay.

Is `C:\Users\benle\Documents\Werkles` the source all Aeyes should read, or is the active git-backed workspace somewhere else, such as `C:\Users\benle\Desktop\github\Werkles`?

2. Provide the actual GimpDash / Speaker location.

Needed if it exists outside this repo:

- local folder path, or
- app URL / localhost port, or
- repo name, or
- log/config path.

3. Approve a read-only inspection of global Codex state if needed.

Useful paths:

- `C:\Users\benle\.codex\config.toml`
- `C:\Users\benle\.codex\.codex-global-state.json`
- `C:\Users\benle\.codex\state_5.sqlite`
- `C:\Users\benle\.codex\sessions\`

No secrets should be printed or recorded.

4. Tell Codex whether to patch the cockpit now.

Recommended repo-local repairs:

- update `AGENTS.md` to defer stale Cursor language to cockpit files
- update `foreman/LANES.md` to record `app/**`, `lib/**`, `components/**`, `werkles-api/**`, `bellows/**`, and Maker copy packet authority
- create `foreman/AI_COUSINS_PROTOCOL.md`
- add `foreman/handoffs/archive/`
- add `foreman/handoffs/inbox/`
- add a packet status manifest, for example `foreman/handoffs/PACKET_MANIFEST.md`
- mark old Cursor onboarding as superseded or move it to archive

5. If GimpDash/Speaker is a browser app, approve browser/Chrome inspection.

Codex will need the URL/tab or permission to use the appropriate browser tool. Login, OAuth, account settings, secrets, billing, and final approvals remain human gates.

## Safe Next Repair Slice

If Ben approves cockpit repair, Codex can do a local-only repair without secrets, deploys, paid calls, or production data:

1. Patch `AGENTS.md` to remove the stale "Cursor not approved" sentence or replace it with "read cockpit files for current lane authority."
2. Patch `foreman/LANES.md` to record actual current ownership and a packet relay maintenance lane.
3. Create `foreman/AI_COUSINS_PROTOCOL.md` with packet lifecycle rules.
4. Create `foreman/handoffs/PACKET_MANIFEST.md` with active, superseded, delivered, and blocked packet states.
5. Move stale outbox packets to `foreman/handoffs/archive/` only if Ben approves that file move.

## Current Stop Point
No secrets, deploys, account settings, paid calls, SQL, production data, or browser login work was attempted.

The local audit found enough evidence to suspect the relay is not disconnected at a single code call. The relay is under-specified, stale, and likely pointed at a non-git local workspace that other Aeyes cannot automatically see.
