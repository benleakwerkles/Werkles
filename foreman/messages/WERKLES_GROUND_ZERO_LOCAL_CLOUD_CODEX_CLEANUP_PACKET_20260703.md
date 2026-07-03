# Werkles Ground Zero Local + Cloud + Codex Cleanup Packet

Status: ACTIVE SUPERSEDING PACKET
Issued: 2026-07-03
Audience: every Dink / Aeye / Codex cousin touching Werkles after the Werkles1 -> Werkles rename
Canonical GitHub repo: https://github.com/benleakwerkles/Werkles.git
Canonical repository full name: benleakwerkles/Werkles
Expected GitHub repository id: 1242158598
Canonical branch: main
Canonical local checkout: C:\Users\<user>\github\Werkles
Human gate: Ben demanded ground-zero cleanup, not "mostly clean" local state with a smeared Codex project wrapper.

## Why This Packet Exists

The previous cleanup fixed the GitHub repo name and local source-tree direction, but it did not fully guard the Codex saved-project binding.

That means GitHub can be correct while Codex still spins on a stale project pointer.

The rename sequence was:

```text
old stub: benleakwerkles/Werkles -> benleakwerkles/Werkles-retired-delete-me-20260702
real repo: benleakwerkles/Werkles1 -> benleakwerkles/Werkles
```

The repo name is now correct. The repo object behind that name is not the old stub. Any cloud system that cached the old repo object must be treated as dirty until it proves it can see the new repo object.

Ground zero is not:

- local git can push
- GitHub opens in a browser
- a cousin can fetch a public file
- a Codex thread can work projectless
- the UI spinner eventually stops

Ground zero is:

```text
one local active Werkles checkout
one canonical GitHub repo object
one canonical remote
one canonical branch
dirty roots inventoried and preserved
local guard installed
Codex project binding either verified or explicitly marked NOT_VISIBLE/BLOCKED
every cousin returns the required readback
```

If any one of those is missing, the machine is not fully clean.

## Do Not Make Ben The Mule

Do not tell Ben to:

- manually paste repo state
- manually paste packet contents
- manually create project objects that the Codex interface does not actually expose
- archive invisible projects
- click around a spinning interface as the primary repair method

If the interface does not expose a repair control, say that directly and use the available proof surfaces.

Available proof surfaces include:

- local git commands
- GitHub API repo metadata
- GitHub `origin/main` readback
- Codex app tool readback, if visible
- durable local receipts
- canonical repo packets

## Ground-Zero Rule

No cousin may report `COMPLETE` unless this block is complete:

```text
LOCAL_CANONICAL_PATH_VERIFIED:
LOCAL_CANONICAL_REMOTE_VERIFIED:
LOCAL_BRANCH_MAIN_VERIFIED:
GITHUB_API_REPO_ID_VERIFIED:
GITHUB_ORIGIN_MAIN_VERIFIED:
DIRTY_ROOT_INVENTORY_VERIFIED:
SALVAGE_EVIDENCE_PRESERVED:
LOCAL_GUARD_INSTALLED:
CODEX_PROJECT_BINDING_STATUS: VERIFIED|NOT_VISIBLE|BLOCKED|PROJECTLESS_RECOVERY_LANE
CODEX_PROJECT_BINDING_EVIDENCE:
GROUND_ZERO_COMPLETE: YES|NO
```

Only `CODEX_PROJECT_BINDING_STATUS: VERIFIED` may support `GROUND_ZERO_COMPLETE: YES`.

`PROJECTLESS_RECOVERY_LANE` is allowed for getting work done while the interface is broken, but it is not a full cleanup closeout.

## First Command On Every Machine

From the canonical checkout if it exists:

```powershell
cd C:\Users\<user>\github\Werkles
git pull --ff-only origin main
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-WerklesGroundZero.ps1 -CodexProjectBindingStatus UNKNOWN
```

Expected behavior:

- The script writes a JSON readback.
- The script exits nonzero unless Codex project binding is explicitly passed as `VERIFIED`.
- A nonzero exit caused only by `codex_project_binding` is a real blocker, not a script failure.

If the canonical checkout does not exist, do not clone first. Inventory likely dirty roots using `foreman/messages/DINK_MASHEEN_WERKLES_LOCAL_CLOUD_CLEANUP_PACKET_20260702.md`, then create/move the canonical checkout only after salvage is preserved.

## Ground-Zero Verifier

The verifier is:

```text
scripts/foreman/Test-WerklesGroundZero.ps1
```

It checks:

1. `C:\Users\<user>\github\Werkles` exists.
2. The path is a git checkout.
3. `origin` is `https://github.com/benleakwerkles/Werkles.git`.
4. Branch is `main`.
5. GitHub `origin/main` is readable.
6. GitHub API says:
   - `full_name = benleakwerkles/Werkles`
   - `id = 1242158598`
   - `default_branch = main`
   - `archived = false`
7. `Assert-WerklesCanonical.ps1` passes.
8. `Inventory-WerklesLocalSources.ps1` ran with dirty-root scan.
9. Forbidden active duplicate git roots are not present.
10. Dirty roots are classified with disposition evidence.
11. Codex project binding was explicitly verified, or the readback blocks completion.

It writes receipts under:

```text
C:\Users\<user>\github\Werkles-local-merge-receipts
```

When a Codex cousin can prove the saved project binding, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-WerklesGroundZero.ps1 `
  -CodexProjectBindingStatus VERIFIED `
  -CodexProjectBindingEvidence "codex_app.list_projects shows project <id> bound to benleakwerkles/Werkles main" `
  -DirtyRootDispositionEvidence "All dirty roots classified in readback; salvage/patch/blocker evidence listed."
```

If the Codex project list is empty:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-WerklesGroundZero.ps1 `
  -CodexProjectBindingStatus NOT_VISIBLE `
  -CodexProjectBindingEvidence "codex_app.list_projects returned [] in this thread" `
  -DirtyRootDispositionEvidence "All dirty roots classified in readback; salvage/patch/blocker evidence listed."
```

That is not complete. It is an honest blocker.

If the script finds dirty roots and no `-DirtyRootDispositionEvidence` is supplied, it must fail. Inventory alone is not cleanup.

## Codex Cloud Binding Check

Any Codex cousin with access to the Codex app tools must run:

```text
codex_app.list_projects
```

Return:

```text
CODEX_PROJECTS_VISIBLE:
WERKLES_PROJECT_VISIBLE:
WERKLES_PROJECT_ID:
PROJECT_REPO_FULL_NAME:
PROJECT_BRANCH:
PROJECT_ENVIRONMENT:
CODEX_PROJECT_BINDING_STATUS:
CODEX_PROJECT_BINDING_EVIDENCE:
```

Interpretation:

| Readback | Meaning | Required action |
|---|---|---|
| `projects: []` | This thread cannot see any saved project binding. | Mark `NOT_VISIBLE`; do not call ground zero complete. Continue only in projectless local recovery lane. |
| Werkles project visible and repo is `benleakwerkles/Werkles` on `main` | Binding is verified. | Mark `VERIFIED`; run ground-zero verifier with `-CodexProjectBindingStatus VERIFIED`. |
| Werkles project visible but repo id/full name is old stub or unknown | Stale binding. | Mark `BLOCKED`; do not use that project for work. |
| Interface spins and no tool proof exists | Unproven binding. | Mark `BLOCKED`; do not ask Ben to click around as the proof method. |

Important: a thread can be projectless and still useful. That is not the same thing as a clean project binding.

## GitHub App / Connector Check

Any cousin with GitHub connector tools must read:

```text
mcp__codex_apps__github._get_repo(repository_full_name = "benleakwerkles/Werkles")
mcp__codex_apps__github._list_installed_accounts()
mcp__codex_apps__github._list_installations()
```

Required readback:

```text
GITHUB_REPO_FULL_NAME:
GITHUB_REPO_ID:
GITHUB_DEFAULT_BRANCH:
GITHUB_CLONE_URL:
GITHUB_VISIBILITY:
GITHUB_ARCHIVED:
CONNECTOR_PULL:
CONNECTOR_PUSH:
GITHUB_APP_INSTALLED_ACCOUNTS:
GITHUB_APP_INSTALLATION_URLS:
CONNECTOR_STATUS:
```

Known current evidence from this thread on 2026-07-03:

```text
GITHUB_REPO_FULL_NAME: benleakwerkles/Werkles
GITHUB_REPO_ID: 1242158598
GITHUB_DEFAULT_BRANCH: main
GITHUB_CLONE_URL: https://github.com/benleakwerkles/Werkles.git
CONNECTOR_PULL: true
CONNECTOR_PUSH: false
GITHUB_APP_INSTALLED_ACCOUNT_OBSERVED: courtneydleak-del
CODEX_PROJECTS_VISIBLE_OBSERVED: []
```

That evidence means:

- GitHub cloud read works.
- The connector can read the canonical public repo.
- The connector cannot write through GitHub app tools in this context.
- The saved Codex project binding was not visible in this thread.
- This is not full ground zero.

If a cousin needs cloud write through the GitHub connector, the GitHub app installation must include the owner/repo that owns `benleakwerkles/Werkles`. Local git push may still work with Ben's local credentials, but that is not the same as connector write.

## Dirty Root Hunt

Do not shrink this to the obvious folder.

Check at least:

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

Run:

```powershell
cd C:\Users\<user>\github\Werkles
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Inventory-WerklesLocalSources.ps1 -ScanDepth 4
```

Rules:

- Do not delete unknown work.
- Do not import `C:\speaker`, `C:\tinkarden`, or `C:\TinkerDen` wholesale.
- Preserve unique commits as salvage branches.
- Preserve dirty/untracked files as patch receipts and untracked receipts.
- No duplicate active Werkles git checkout may remain.

## Forward Guardrail

After local convergence:

```powershell
cd C:\Users\<user>\github\Werkles
git pull --ff-only origin main
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Assert-WerklesCanonical.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Install-WerklesGitGuard.ps1
```

Then run:

```powershell
npm.cmd run groundzero:werkles
```

If it fails only because Codex project binding is unknown, return the blocker. Do not paper it over.

## Projectless Recovery Lane

If Codex project binding is broken but local git and GitHub are healthy, cousins may continue urgent work only under this label:

```text
MODE: PROJECTLESS_RECOVERY_LANE
CANONICAL_LOCAL_PATH: C:\Users\<user>\github\Werkles
CANONICAL_REMOTE: https://github.com/benleakwerkles/Werkles.git
GITHUB_REPO_ID: 1242158598
GROUND_ZERO_COMPLETE: NO
REASON: Codex saved-project binding not verified.
```

This is not "close enough." It is a controlled recovery lane to stop Ben from being trapped by the broken app wrapper.

Do not create new doctrine, new source roots, new mirrors, or new repo names from this lane.

Allowed:

- read repo files
- edit canonical local checkout
- commit/push through local git if guard passes
- write receipts
- run cleanup scripts

Forbidden:

- declaring Codex cloud project healthy
- reviving `Werkles1`
- using the retired stub
- treating UI spinner as proof
- making Ben manually courier repo state

## Required Cousin Readback

Every cousin must return this exact block:

```text
GROUND_ZERO_PACKET: WERKLES_GROUND_ZERO_LOCAL_CLOUD_CODEX_CLEANUP_PACKET_20260703
MACHINE:
HOSTNAME:
COUSIN:
MODE: VERIFIED_PROJECT|PROJECTLESS_RECOVERY_LANE|BLOCKED
CANONICAL_PATH:
CANONICAL_REMOTE:
LOCAL_BRANCH:
LOCAL_HEAD:
GITHUB_REPO_FULL_NAME:
GITHUB_REPO_ID:
GITHUB_DEFAULT_BRANCH:
GITHUB_ORIGIN_MAIN:
GITHUB_CONNECTOR_PULL:
GITHUB_CONNECTOR_PUSH:
CODEX_PROJECTS_VISIBLE:
WERKLES_PROJECT_VISIBLE:
WERKLES_PROJECT_ID:
CODEX_PROJECT_BINDING_STATUS:
CODEX_PROJECT_BINDING_EVIDENCE:
INVENTORY_RECEIPT:
GROUND_ZERO_RECEIPT:
DIRTY_ROOTS_FOUND:
DIRTY_ROOT_DISPOSITION_EVIDENCE:
SALVAGE_BRANCHES_CREATED:
PATCH_RECEIPTS_CREATED:
GUARD_RECEIPT:
GUARD_INSTALLED:
GROUND_ZERO_COMPLETE: YES|NO
BLOCKERS:
NEXT_ACTION:
```

If `GROUND_ZERO_COMPLETE` is `YES`, the readback must include:

```text
CODEX_PROJECT_BINDING_STATUS: VERIFIED
GITHUB_REPO_ID: 1242158598
CANONICAL_REMOTE: https://github.com/benleakwerkles/Werkles.git
```

Otherwise it is not complete.

## Starter Packet For Cousins

Use this exact prompt:

```text
Execute the Werkles Ground Zero Local + Cloud + Codex Cleanup Packet.

Use canonical repo:
https://github.com/benleakwerkles/Werkles.git

Read:
foreman/messages/WERKLES_GROUND_ZERO_LOCAL_CLOUD_CODEX_CLEANUP_PACKET_20260703.md
foreman/messages/DINK_MASHEEN_WERKLES_LOCAL_CLOUD_CLEANUP_PACKET_20260702.md

Do not delete unknown work.
Do not revive Werkles1.
Do not call local git success a Codex cloud project success.
Do not ask Ben to manually courier repo state.

Run the dirty-root inventory and ground-zero verifier.
Then check the Codex project binding through codex_app.list_projects if that tool is available.
Return the required readback block exactly.
```

## Final Rule

If the machine has a clean local checkout but Codex project binding is not visible, say:

```text
LOCAL/GITHUB CLEAN: YES
CODEX PROJECT BINDING CLEAN: NO
GROUND ZERO COMPLETE: NO
MODE: PROJECTLESS_RECOVERY_LANE
```

That is honest. Anything softer than that restarts the mess.
