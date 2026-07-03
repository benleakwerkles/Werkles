# Maker + Aeye Repo Settings Alignment Packet

Status: ACTIVE
Issued: 2026-07-03
Audience: Maker, Ender, Dink/Codex, Brainstormers, Speaker/Atlas, Shakespeare, Chokidar, ThinkIt, and any future Aeye or watcher that reads Werkles project state
Canonical GitHub repo: https://github.com/benleakwerkles/Werkles.git
Canonical repository full name: benleakwerkles/Werkles
Canonical GitHub repository id: 1242158598
Canonical branch: main
Canonical local checkout: C:\Users\<user>\github\Werkles
Supersedes: any setting, workspace, project, bookmark, thread, watcher, cache, or bootpack still pointing at Werkles1, the retired stub, or a Desktop-path active checkout

## Mission

Stop Werkles from splitting into local/GitHub/cloud/project impostors again.

This packet tells Maker how to set its workspace, tells Ben which repo/project settings matter, tells Ender and the Brainstormers what they can and cannot claim, and tells observer tools like Speaker, Atlas, Shakespeare, and Chokidar what project identity they must carry forward.

No cousin may rely on the visible repo name alone. The name `Werkles` is not enough. The repo object must match:

```text
repository_full_name: benleakwerkles/Werkles
repository_id: 1242158598
remote: https://github.com/benleakwerkles/Werkles.git
branch: main
```

## Why This Exists

The cleanup renamed the old stub and promoted the real repo:

```text
old stub: benleakwerkles/Werkles -> benleakwerkles/Werkles-retired-delete-me-20260702
real repo: benleakwerkles/Werkles1 -> benleakwerkles/Werkles
```

That fixed GitHub naming, but a tool can still cache the old repo object, old local folder, old branch, or old project binding.

The failure mode is:

```text
UI says Werkles
tool thinks old Werkles object
local machine edits another Werkles folder
agent reports success from the wrong surface
Ben becomes the map again
```

This packet exists to make every surface prove the same identity before work begins.

## Source Files To Read First

Read these before changing settings or accepting a handoff:

1. `foreman/messages/WERKLES_GROUND_ZERO_LOCAL_CLOUD_CODEX_CLEANUP_PACKET_20260703.md`
2. `scripts/foreman/Test-WerklesGroundZero.ps1`
3. `foreman/messages/DINK_MASHEEN_WERKLES_LOCAL_CLOUD_CLEANUP_PACKET_20260702.md`
4. `foreman/AI_COUSINS_PROTOCOL.md`
5. `foreman/source-truth/SOURCE_TRUTH_POLICY.md`
6. `source-truth-plan/SOURCE_OF_TRUTH_PLAN.md`
7. `source-truth-plan/BOOTPACK_SOURCE_TRUTH.md`
8. `foreman/speaker/AEYE_ROLE_REGISTRY.md`
9. `foreman/speaker/entries/DRAFT_20260627-github-source-truth-is-canon.md`
10. `foreman/speaker/entries/DRAFT_20260627-local-only-proof-is-not-canon.md`

If an agent cannot read those files, it must say exactly which files are missing instead of guessing from chat.

### Missing-File Trap Door

If an agent reports those files are missing, first prove where it is standing.

Required readback before any `MISSING_FILE` claim:

```text
CURRENT_WORKING_DIRECTORY:
CANONICAL_CHECKOUT_TESTED: C:\Users\<user>\github\Werkles
CANONICAL_CHECKOUT_EXISTS: YES|NO
CANONICAL_GIT_ROOT:
CURRENT_REMOTE_ORIGIN:
CURRENT_BRANCH:
MISSING_FILE_PATHS:
```

If `CURRENT_WORKING_DIRECTORY` is a relay/projectless folder such as:

```text
C:\Users\<user>\Documents\Codex\...\*-relay-receiver
C:\Users\<user>\Documents\Codex\...\execute-the-dink-masheen-werkles-local
```

then the files are not proven missing. The agent is in the wrong working folder for repo-relative reads.

Correct recovery:

```powershell
$Repo = Join-Path $env:USERPROFILE "github\Werkles"
if (Test-Path -LiteralPath (Join-Path $Repo ".git")) {
  Set-Location $Repo
  git pull --ff-only origin main
} else {
  Write-Host "CANONICAL_CHECKOUT_MISSING: inventory dirty roots before clone or move"
  Write-Host "CANONICAL_REPO: https://github.com/benleakwerkles/Werkles.git"
}
```

Only after the agent has tested the absolute canonical path may it say a source file is truly missing from the machine.

## Ben Settings Checklist

These are human-account settings. A cousin may guide and verify readbacks, but must not enter credentials or click final account/security approvals without explicit permission.

### GitHub Repo Identity

Check:

```text
Owner/repo: benleakwerkles/Werkles
Repo id: 1242158598
Default branch: main
Archived: false
Remote URL: https://github.com/benleakwerkles/Werkles.git
```

Verification surfaces:

```powershell
git -C C:\Users\<user>\github\Werkles remote -v
git -C C:\Users\<user>\github\Werkles ls-remote --heads origin main
Invoke-RestMethod -Uri "https://api.github.com/repos/benleakwerkles/Werkles" -Headers @{ "User-Agent" = "WerklesGroundZero" }
```

Blockers:

- Repo id is not `1242158598`.
- Default branch is not `main`.
- Repo is archived.
- Remote mentions `Werkles1` or `Werkles-retired-delete-me-20260702`.

### GitHub App / Codex Connector Access

In GitHub, review the installed GitHub App for OpenAI/ChatGPT/Codex under the owner account that can access `benleakwerkles/Werkles`.

Required setting:

```text
Repository access includes: benleakwerkles/Werkles
```

If the app is set to selected repositories, select `Werkles` under the `benleakwerkles` owner. Do not select `Werkles1` or the retired stub.

Required connector readback:

```text
GITHUB_APP_INSTALLED_ACCOUNT:
GITHUB_APP_INSTALLATION_URL:
GITHUB_REPO_FULL_NAME:
GITHUB_REPO_ID:
CONNECTOR_PULL:
CONNECTOR_PUSH:
CONNECTOR_STATUS:
```

If `CONNECTOR_PULL=true` and `CONNECTOR_PUSH=false`, cloud reading works but cloud writing through the GitHub connector is not proven. Mark:

```text
CONNECTOR_STATUS: READ_ONLY_CONNECTOR_BLOCKER
```

Local git push may still work through Ben's local credentials. Do not confuse that with connector write access.

### Codex Project / Cloud Environment

Codex cloud must prove it is bound to:

```text
repo: benleakwerkles/Werkles
branch: main
repo id: 1242158598
```

Required tool proof where available:

```text
codex_app.list_projects
```

Valid results:

| Result | Meaning |
|---|---|
| Werkles project visible with repo `benleakwerkles/Werkles` and branch `main` | `CODEX_PROJECT_BINDING_STATUS: VERIFIED` |
| `projects: []` | `CODEX_PROJECT_BINDING_STATUS: NOT_VISIBLE` |
| Werkles project visible but stale/unknown repo identity | `CODEX_PROJECT_BINDING_STATUS: BLOCKED_STALE_BINDING` |
| UI spins and no tool proof exists | `CODEX_PROJECT_BINDING_STATUS: BLOCKED_UI_UNPROVEN` |

Do not ask Ben to archive, create, or rebind a project if the interface does not expose that action. Return the status above and keep urgent work in:

```text
MODE: PROJECTLESS_RECOVERY_LANE
```

### GitHub Branch / Ruleset Settings

Goal: protect `main` without trapping the current recovery path.

Immediate minimum:

- No force pushes to `main`.
- No deleting `main`.
- No repo rename without explicit Ben gate.
- No `Werkles1` resurrection.
- No required status check unless that check actually exists and is passing.

Recommended staged approach:

1. Phase 1, while recovery is active: rely on local guard + explicit readback + human gate before push.
2. Phase 2, after every machine has passed ground-zero: create a GitHub ruleset or branch protection for `main`.
3. Phase 3, after CI names are stable: require the real checks by exact job name.

Suggested `main` protection settings once stable:

```text
Target: main
Block force pushes
Block deletion
Require pull request before merge for non-Ben/non-admin actors
Require conversation resolution
Require linear history if it matches the repo workflow
Restrict bypass to Ben/admin only
Do not require nonexistent status checks
```

If a ruleset is created, return:

```text
GITHUB_RULESET_NAME:
GITHUB_RULESET_TARGET:
GITHUB_RULESET_ENFORCEMENT: ACTIVE|EVALUATE|DISABLED
GITHUB_RULESET_BYPASS_ACTORS:
GITHUB_MAIN_FORCE_PUSH_BLOCKED:
GITHUB_MAIN_DELETE_BLOCKED:
GITHUB_MAIN_PR_REQUIRED:
STATUS_CHECKS_REQUIRED:
BLOCKERS:
```

## Maker / Cursor Settings

Maker is the bounded app/UI implementation lane. Maker does not decide source truth, approve gates, or ratify final copy.

Maker must set its workspace to:

```text
C:\Users\<user>\github\Werkles
```

Maker must close or ignore:

```text
C:\Users\<user>\github\Werkles1
C:\Users\<user>\Desktop\github\Werkles
C:\Users\<user>\Desktop\github\Werkles1
C:\Users\<user>\Desktop\Werkles_DIRTY_BACKUP
```

Maker session start:

```powershell
cd C:\Users\<user>\github\Werkles
git pull --ff-only origin main
npm.cmd run groundzero:werkles
```

Expected: `groundzero:werkles` may fail if Codex project binding is not verified. Maker must not treat that as a code failure. It is a project-binding blocker.

Maker local guard:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Install-WerklesGitGuard.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Assert-WerklesCanonical.ps1
```

Maker IDE settings to check:

```text
Workspace folder: C:\Users\<user>\github\Werkles
Terminal cwd: C:\Users\<user>\github\Werkles
Git remote shown by IDE: https://github.com/benleakwerkles/Werkles.git
Branch shown by IDE: main or an explicit named work branch
AI/project instructions: include this packet and WERKLES_GROUND_ZERO_LOCAL_CLOUD_CODEX_CLEANUP_PACKET_20260703.md
Agent run mode: if routine non-gate commands start prompting, check Cursor Settings -> Agents -> Run Mode before changing doctrine
```

Maker forbidden claims:

- "I built this" without path, branch, commit, and proof command.
- "Main is current" without `origin/main` readback.
- "The repo is clean" when ground-zero returns Codex binding `NOT_VISIBLE`.
- "This local preview proves canon."

Maker required readback:

```text
MAKER_WORKSPACE_PATH:
MAKER_TERMINAL_CWD:
MAKER_GIT_REMOTE:
MAKER_BRANCH:
MAKER_HEAD:
MAKER_WORKTREE_STATUS:
MAKER_GROUND_ZERO_STATUS:
MAKER_CODEX_PROJECT_BINDING_STATUS:
MAKER_IDE_SETTINGS_CHECKED:
OLD_WORKSPACES_CLOSED:
BLOCKERS:
```

## Ender / Claude Settings

Ender owns experience, visual continuity, emotional arc, scene logic, and UX review. Ender does not own final copy voice, repo mutation, release approval, or source-truth promotion.

Ender project instructions must include:

```text
foreman/platform-instructions/CLAUDE_ENDER_PROJECT_INSTRUCTIONS.md
foreman/messages/MAKER_AEYE_REPO_SETTINGS_ALIGNMENT_PACKET_20260703.md
foreman/messages/WERKLES_GROUND_ZERO_LOCAL_CLOUD_CODEX_CLEANUP_PACKET_20260703.md
foreman/source-truth/SOURCE_TRUTH_POLICY.md
foreman/speaker/AEYE_ROLE_REGISTRY.md
```

Ender must cite any repo fact using:

```text
repo: benleakwerkles/Werkles
branch or commit:
file path:
date checked:
source packet:
```

If Ender is not connected to GitHub or a repo export, it must say:

```text
REPO_FACT_STATUS: UNVERIFIED
```

Ender must not:

- tell Maker a stale local folder is safe
- approve final copy as Ben
- promote local evidence to canon
- assume a repo rename fixed Codex project binding
- request passwords, secrets, OAuth tokens, account settings, or private keys

Ender required readback:

```text
ENDER_PROJECT_CONTEXT_UPDATED:
ENDER_REPO_SOURCE:
ENDER_REPO_FULL_NAME:
ENDER_REPO_ID:
ENDER_BRANCH_OR_COMMIT:
ENDER_CAN_CLAIM_IMPLEMENTATION: NO
ENDER_CAN_APPROVE_FINAL_COPY: NO
BLOCKERS:
```

## Dink / Codex Settings

Dink/Codex owns repo maintenance, handoff packets, scripts, verifier receipts, and local recovery. Dink must not call local GitHub success a Codex cloud project success.

Codex session start:

```text
codex_app.list_projects
```

Then:

```powershell
cd C:\Users\<user>\github\Werkles
git pull --ff-only origin main
npm.cmd run groundzero:werkles
```

If `codex_app.list_projects` returns `[]`, Dink must report:

```text
LOCAL/GITHUB CLEAN: YES|NO
CODEX PROJECT BINDING CLEAN: NO
GROUND ZERO COMPLETE: NO
MODE: PROJECTLESS_RECOVERY_LANE
```

Dink may continue urgent local recovery in projectless mode, but must not mark the whole cleanup complete.

## Brainstormers

Brainstormers include Skybro, Computer, Sherlock, Bean, Petra, and future research/review Aeyes.

Brainstormers are not the source of repo truth. They may reason, research, review, red-team, and propose, but they must not promote a branch, ratify a repo setting, or claim local state.

Required Brainstormer context:

```text
repo: benleakwerkles/Werkles
repo id: 1242158598
canonical branch: main
source-truth policy: foreman/source-truth/SOURCE_TRUTH_POLICY.md
ground-zero packet: foreman/messages/WERKLES_GROUND_ZERO_LOCAL_CLOUD_CODEX_CLEANUP_PACKET_20260703.md
role registry: foreman/speaker/AEYE_ROLE_REGISTRY.md
```

Brainstormer output must distinguish:

```text
CANONICAL_GITHUB_FACT
CANDIDATE_REVIEW_FACT
LOCAL_EVIDENCE_ONLY
UNVERIFIED_MEMORY
EXTERNAL_SOURCE_CHECKED
```

Brainstormers must return:

```text
BRAINSTORMER:
PLATFORM:
REPO_CONTEXT_SUPPLIED:
REPO_FULL_NAME:
REPO_ID:
BRANCH_OR_COMMIT:
CAN_CLAIM_LOCAL_STATE: NO
CAN_PROMOTE_SOURCE_TRUTH: NO
SOURCE_CLASSIFICATIONS_USED:
BLOCKERS:
```

## Info / Watcher Systems

This applies to Speaker, Atlas, ThinkIt, Shakespeare, Chokidar, and any future file watcher, prose watcher, source-truth mirror, or briefing system.

### Speaker

Speaker preserves rationale and warnings. Speaker may draft memory entries. Speaker does not execute, route, delete, promote, or ratify.

Speaker must warn if a cousin says:

```text
local branch is canon
preview proves source truth
Werkles1 is still the repo
Codex project binding is fixed because local git works
Maker approved a human gate
Ender approved final copy
```

### Atlas

Atlas reads GitHub truth and produces branch/source readbacks. Atlas does not promote truth.

Atlas required proof:

```text
GITHUB_REPO_FULL_NAME:
GITHUB_REPO_ID:
BRANCH:
HEAD_SHA:
READBACK_TIME:
```

### Shakespeare

Shakespeare is a prose/story/information surface if activated. It may shape language from approved source files. It must not invent project history, decide canon, or outrank the repo.

Shakespeare must read:

```text
foreman/source-truth/SOURCE_TRUTH_POLICY.md
source-truth-plan/BOOTPACK_SOURCE_TRUTH.md
source-truth-plan/CHAPTER_SOURCE_LOCK.json when working on manuscript material
```

### Chokidar

Chokidar is a watcher/event surface if activated. A filesystem event is not source truth.

Chokidar must emit event receipts with:

```text
watched_root:
event_path:
event_type:
repo_full_name:
repo_id:
branch:
head:
classification: CANONICAL_PATH|RETIRED_ARCHIVE|ADJACENT_RUNTIME|UNKNOWN
action_taken:
```

Chokidar must not auto-delete, auto-promote, auto-commit, or auto-dispatch from file events.

### ThinkIt / TinkerDen

ThinkIt writes shared status and routes work. It must show source-truth and ground-zero status before general daemon health when the topic is repo/project identity.

ThinkIt must display:

```text
canonical repo
repo id
canonical local path
latest ground-zero receipt
Codex project binding status
dirty-root blockers
current mode: VERIFIED_PROJECT|PROJECTLESS_RECOVERY_LANE|BLOCKED
```

## All-Machine Standard

Each machine must converge to:

```text
C:\Users\<user>\github\Werkles
https://github.com/benleakwerkles/Werkles.git
main
```

Every machine must run:

```powershell
cd C:\Users\<user>\github\Werkles
git pull --ff-only origin main
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Inventory-WerklesLocalSources.ps1 -ScanDepth 4
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Assert-WerklesCanonical.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Install-WerklesGitGuard.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-WerklesGroundZero.ps1 -CodexProjectBindingStatus UNKNOWN
```

Do not delete unknown work. Preserve divergent work as salvage evidence.

## Required Full Readback

Every cousin or machine receiving this packet must return:

```text
PACKET: MAKER_AEYE_REPO_SETTINGS_ALIGNMENT_PACKET_20260703
ROLE:
PLATFORM:
MACHINE:
HOSTNAME:
MODE: VERIFIED_PROJECT|PROJECTLESS_RECOVERY_LANE|READ_ONLY_RESEARCH|BLOCKED
CANONICAL_PATH:
CANONICAL_REMOTE:
BRANCH:
HEAD:
WORKTREE_STATUS:
GITHUB_REPO_FULL_NAME:
GITHUB_REPO_ID:
GITHUB_DEFAULT_BRANCH:
GITHUB_ARCHIVED:
GITHUB_CONNECTOR_PULL:
GITHUB_CONNECTOR_PUSH:
CODEX_PROJECTS_VISIBLE:
WERKLES_PROJECT_VISIBLE:
WERKLES_PROJECT_ID:
CODEX_PROJECT_BINDING_STATUS:
MAKER_WORKSPACE_PATH:
ENDER_PROJECT_CONTEXT_UPDATED:
BRAINSTORMER_REPO_CONTEXT_SUPPLIED:
WATCHER_REPO_CONTEXT_SUPPLIED:
GITHUB_RULESET_OR_BRANCH_PROTECTION_STATUS:
LOCAL_GUARD_INSTALLED:
GROUND_ZERO_RECEIPT:
DIRTY_ROOTS_FOUND:
DIRTY_ROOT_DISPOSITION_EVIDENCE:
BLOCKERS:
NEXT_ACTION:
```

## External References Checked

Official references checked on 2026-07-03:

- GitHub installed app repository access: https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps
- GitHub rulesets: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- GitHub ruleset creation: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository
- GitHub protected branches: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- Codex web GitHub connection: https://developers.openai.com/codex/cloud
- Codex cloud environments: https://developers.openai.com/codex/cloud/environments

## Final Rule

If a cousin cannot prove repo full name, repo id, branch, local path, and binding status, it must not say the project is clean.

Names lie after renames. IDs, remotes, branches, paths, and receipts tell the truth.
