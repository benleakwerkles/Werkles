# Dink@Betsy — Werkles Branch Sync + Clean Workflow Packet

Status: ACTIVE HANDOFF
Issued: 2026-07-04
Audience: Dink@Betsy (or substitute Dink on hostname `DESKTOP-KTBH0LA`)
Human gate: Ben must approve every `git push`, merge to `main`, deploy, SQL, secrets, and production promotion.
Supersedes: partial context only — still read the guardrail stack listed below.

## Starter Message For Dink

```text
You are Dink@Betsy. Read and execute:
foreman/messages/DINK_BETSY_WERKLES_BRANCH_SYNC_AND_CLEAN_WORKFLOW_PACKET_20260704.md

Begin with LOCAL HANDS READBACK. Work only from the git checkout at:
C:\Users\Ben Leak\github\Werkles

Do not treat C:\Users\Ben Leak\Desktop\github\Werkles as the git root — it has no .git.
Do not push to main without Ben gate. Return the required readback block at the end.
```

## Plain Mission

Betsy consolidation is mostly done. The remaining job is **sync discipline**, not another folder hunt.

1. Confirm one active git checkout.
2. Confirm local branch matches the intended GitHub remote branch.
3. Commit or stash the current dirty work.
4. Compare against `origin/main` and report divergence — do not silently merge.
5. Push only the branch Ben names — never `main` without gate.
6. Repoint Cursor / Codex / relay threads to the canonical git path.

## Verified Betsy State (Maker readback 2026-07-04)

```text
LOCAL HANDS READBACK
Machine: Betsy
Repo: C:\Users\Ben Leak\github\Werkles
Branch: maker/site-g-20260703
Commit: 19333c9
Upstream: origin/consolidation/werkles-unified-20260702-push (ahead 2)
Working tree: DIRTY — modified app/globals.css, foreman/BETSY_BASELINE_v1.md, foreman/MACHINE_TOPOLOGY.md, foreman/source-truth/SOURCE_TRUTH_POINTER.json; untracked LOCAL_SOURCE_TRUTH_POINTER.json and BETSY_LOCAL_SOURCE_TRUTH_READBACK.json
Terminal: available
Localhost: no listener on 3000/3002/3047/3339/3342 at readback time
Port: none
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS
```

### GitHub remote tips (after fetch)

| Ref | Tip | Note |
|-----|-----|------|
| `origin/main` | `ec4772c` | Harvey Nerdkle nursery architecture artifacts |
| `origin/consolidation/werkles-unified-20260702-push` | `ddc3735` | Consolidation lane already on GitHub |
| Local `maker/site-g-20260703` | `19333c9` | 2 commits ahead of consolidation push branch; 3 commits not on main; 1 commit on main not in this branch |

Commits on local branch but not on `origin/main`:

```text
19333c9 Add sign-in hunt page and member works-now status card.
be7b6d3 checkpoint before checking out consolidation/werkles-unified-20260702-push
ddc3735 Consolidate Werkles lanes onto main for push.
```

Commit on `origin/main` not in local branch:

```text
ec4772c Add Harvey Nerdkle nursery architecture artifacts
```

**Interpretation:** branches have diverged. This is normal after consolidation. Dink must report it; Dink must not merge to `main` without Ben gate.

## Canonical Addresses (do not improvise)

### Local git root (only active checkout)

```text
C:\Users\Ben Leak\github\Werkles
```

### GitHub

```text
https://github.com/benleakwerkles/Werkles.git
full_name: benleakwerkles/Werkles
repo_id: 1242158598
```

### Cursor IDE workspace (UI only — not git root)

```text
C:\Users\Ben Leak\Desktop\github\Werkles
```

This Desktop folder is a **separate copy with no `.git`**. File hashes may match today and diverge tomorrow. All git commands, commits, pushes, and guard scripts must use the `github\Werkles` path.

**Operator action:** repoint Cursor to `C:\Users\Ben Leak\github\Werkles` when convenient so edits and git state stay unified.

### Cursor Cloud agent workspace

```text
/workspace
```

Cloud agents see committed/pushed GitHub state only. They cannot see Betsy uncommitted changes or local `.env`. For local proof, request a `LOCAL_SALLY_WINDOWS` readback from Dink@Betsy.

### DOSS clean reference (verification only)

```text
C:\Users\BenLeak\github\Werkles
HEAD: f2f438c (ground-zero receipt 2026-07-03)
```

DOSS is proven clean on `main`. Betsy is not ground-zero complete until it returns its own readback.

## Hard Stops (cockpit law)

From `foreman/HUMAN_GATES.md` and `foreman/NEXT_ACTION.md`:

```text
STOP without Ben gate:
- push to main
- merge to main
- production deploy
- production env rollout
- SQL / schema / RLS
- secrets entry
- Stripe live
- Ghost Forge spend (Gate 05 PAUSE)
- merge salvage branches into main
```

Non-gate proofs Dink may run inside approved scope:

```text
PROCEED without gate:
- git status / log / diff / fetch
- dirty-root inventory (read-only classify)
- Assert-WerklesCanonical.ps1
- npm run typecheck
- localhost dev preview (npm run dev)
- branch push ONLY after Ben names the branch target
```

## Dink Procedure — Clean Workflow (ordered)

### Step 0 — LOCAL HANDS READBACK

Required before any edit, commit, push, or dev server start. Use format in `foreman/EXECUTION_CONTEXT_RULES.md`.

### Step 1 — Confirm canonical checkout

```powershell
cd C:\Users\Ben Leak\github\Werkles
git remote -v
git branch --show-current
git status -sb
```

Expected remote:

```text
origin  https://github.com/benleakwerkles/Werkles.git (fetch)
origin  https://github.com/benleakwerkles/Werkles.git (push)
```

If remote is wrong, stop and return blocker — do not push.

### Step 2 — Inventory duplicate folders (Betsy-specific)

Run from canonical checkout:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Inventory-WerklesLocalSources.ps1 -ScanDepth 4
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Assert-WerklesCanonical.ps1
```

Pay special attention to:

```text
C:\Users\Ben Leak\github\Werkles          KEEP — git root
C:\Users\Ben Leak\Desktop\github\Werkles  NOT git root — UI mirror only; do not commit from here
C:\Users\Ben Leak\github\_archive\Werkles-old-main-20260702  ARCHIVE — do not activate
```

Do not delete unknown work. Preserve divergent work as salvage evidence per `foreman/messages/DINK_MASHEEN_WERKLES_LOCAL_CLOUD_CLEANUP_PACKET_20260702.md`.

### Step 3 — Stabilize working tree

Before any push:

```powershell
cd C:\Users\Ben Leak\github\Werkles
git status -sb
git diff --stat
```

If changes are intentional:

```powershell
git add -A
git commit -m "Describe the lane-specific change."
```

If changes are accidental or need Ben review, stop with `WORKTREE_BLOCKER` readback — do not push.

Known dirty items at packet issue:

- `app/globals.css` — member works-now grid styles (may overlap receipt `WERKLES_GLOBALS_CSS_MEDIA_QUERY_FIX_20260703`)
- `foreman/source-truth/SOURCE_TRUTH_POINTER.json` — must point at `benleakwerkles/Werkles`, not `Werkles1`
- untracked local source-truth readback files — commit if Ben wants them durable, else leave untracked and report

### Step 4 — Compare branches (report only)

```powershell
git fetch origin
git rev-list --left-right --count origin/main...HEAD
git log --oneline origin/main..HEAD
git log --oneline HEAD..origin/main
git rev-list --left-right --count origin/consolidation/werkles-unified-20260702-push...HEAD
```

Return counts and commit lists to Ben. Do not merge without gate.

### Step 5 — Push (Ben-gated)

Default safe target after Ben says push:

```powershell
git push -u origin maker/site-g-20260703
```

Or, if Ben wants consolidation branch updated instead:

```powershell
git push origin maker/site-g-20260703:consolidation/werkles-unified-20260702-push
```

Never:

```powershell
git push origin main
git push origin HEAD:main
```

Install guard after convergence if not already installed:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Install-WerklesGitGuard.ps1
```

### Step 6 — Local dev proof (optional, non-gate)

```powershell
cd C:\Users\Ben Leak\github\Werkles
npm run typecheck
npm run dev
```

Preview at `http://localhost:3000` unless `PORT` overrides. Report port in readback.

### Step 7 — Cloud / cousin alignment

After Betsy push, cloud Cursor and other cousins should:

```text
git fetch origin
git checkout maker/site-g-20260703   # or branch Ben names
git pull --ff-only origin <that-branch>
```

Cloud cannot verify Betsy dirty tree — only pushed commits.

## Required Readback Block

Return after executing this packet:

```text
HANDOFF_PACKET: DINK_BETSY_WERKLES_BRANCH_SYNC_AND_CLEAN_WORKFLOW_PACKET_20260704
MACHINE: Betsy
HOSTNAME:
CANONICAL_PATH:
CANONICAL_REMOTE:
BRANCH:
HEAD:
UPSTREAM:
AHEAD_BEHIND_UPSTREAM:
AHEAD_BEHIND_MAIN:
WORKTREE_STATUS:
DESKTOP_MIRROR_DIVERGENCE: SAME|DIFFER|UNKNOWN
INVENTORY_RECEIPT:
GUARD_INSTALLED: YES|NO|BLOCKED
COMMITS_PUSHED:
PUSH_TARGET_BRANCH:
MAIN_MERGE_ATTEMPTED: NO
TYPECHECK:
LOCALHOST:
PORT:
BLOCKERS:
NEXT_ACTION:
```

## Source Files To Read (in order)

1. `foreman/messages/DINK_BETSY_WERKLES_BRANCH_SYNC_AND_CLEAN_WORKFLOW_PACKET_20260704.md` (this file)
2. `foreman/messages/ALL_AEYES_WERKLES_GITHUB_ACCESS_GUARDRAIL_PACKET_20260703.md`
3. `foreman/messages/WERKLES_GROUND_ZERO_LOCAL_CLOUD_CODEX_CLEANUP_PACKET_20260703.md`
4. `foreman/messages/DINK_MASHEEN_WERKLES_LOCAL_CLOUD_CLEANUP_PACKET_20260702.md`
5. `foreman/EXECUTION_CONTEXT_RULES.md`
6. `foreman/NEXT_ACTION.md`
7. `foreman/HUMAN_GATES.md`
8. `foreman/receipts/WERKLES_REPO_CONSOLIDATION_RECEIPT_20260702.md`
9. `foreman/receipts/WERKLES_CONSOLIDATION_PUSH_WITHOUT_LARGE_VIDEOS_20260703.md`

Relay lane work remains separate — see `foreman/messages/DINK_BETSY_RELAY_PROJECT_HANDOFF_PACKET_20260703.md` only if Ben assigns relay packets.

## Failure Modes

| Symptom | Mistake | Correct move |
|---------|---------|----------------|
| `git push` rejected for large files | Playwright `.webm` in receipts | Exclude >100MB captures; see consolidation push receipt |
| Edits in Cursor not in `git status` | Working in Desktop copy | Commit from `github\Werkles`; repoint Cursor |
| "Push everything to main" | Ignoring human gate | Push feature branch only after Ben names target |
| Branches diverged from main | Assuming failure | Report divergence; Ben decides merge/rebase |
| Dink reports COMPLETE | Two active Werkles git roots | Inventory again; one git root only |

## Final Rule

If unsure whether work is safe to push, it stays local until Ben names the branch target and approves the push.
