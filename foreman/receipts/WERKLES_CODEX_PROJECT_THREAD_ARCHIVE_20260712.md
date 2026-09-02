# Werkles Codex Project Thread Archive Receipt

Generated: 2026-07-12

## Action

Archived the stale June 2026 TinkerDen / relay-proof Codex thread cluster so it no longer competes with the newer Werkles project thread set in Codex.

No session files, source files, receipts, or local project folders were deleted.

## Canonical Repo Routing

- Canonical active checkout: `C:\Users\Ben Leak\github\Werkles`
- Git top-level readback: `C:/Users/Ben Leak/github/Werkles`
- Remote readback: `https://github.com/benleakwerkles/Werkles.git`
- Current branch readback: `maker/site-g-20260703`

## Non-Canonical / Confusing Local Folder

- `C:\Users\Ben Leak\Documents\Werkles` exists, but is a local no-commit Git repo.
- Codex app threads may show this path as their cwd label.
- Current Werkles repo work should still route to `C:\Users\Ben Leak\github\Werkles` unless a future explicit receipt supersedes this.

## Threads Archived

Archived via Codex app `set_thread_archived`:

- `019ee168-78fa-73a0-8dff-563672609d52` - `Build TinkerDen packet launcher`
- `019ee168-da34-7bd1-a1fd-ccfc1a8db333` - `Build packet launcher`
- `019f0c7c-0c9f-7672-a5ae-47db42fc03bc` - `Verify Aeye relay receipt`
- `019f0c86-aa2f-78b0-a97e-a0a9d56139c9` - `Verify relay proof thread`
- `019f0c88-6487-7b70-961a-9b3a87058beb` - `Verify relay thread receipt`
- `019f0c99-28a3-73d2-b9e7-a329c10abf1f` - `Acknowledge relay command`

Second pass after the operator still saw the old project cluster:

- `019f34f4-234e-7f23-a661-50be30ade34f` - `Locate thread location`
- `019f2afc-c422-76d3-861c-7dca6aefa6ae` - `Update book architecture locally`
- `019f2ae3-0745-73b2-852f-4f9bdfd048da` - `Locate canonical Werkles folder`
- `019f248f-25b3-7060-8360-c492ef2a1596` - `Red-team architecture section`

## Threads Kept Visible

- `019f3590-73be-7fd3-8733-216ab3105f56` - `Book architecture thread`
- `019f54ce-058c-77c1-b7fc-ba241e7c8750` - `K ... Go to the canonical Werkles cockpit...`
- `019f4b2e-2d04-78f2-91f1-47f722f1eea4` - `TO_HEIMERDINKER_MATCHING_MISSION_LEAD_V1_20260710 ...`

## Diagnosis

There was no `C:\Users\Ben Leak\Documents\Codex\Work` directory on disk during this check. The apparent duplicate project split is coming from Codex thread cwd labels and older scratch conversation directories, not from a live `Codex\Work` folder.

The older active-looking cluster came from June 19 / June 28 TinkerDen relay-proof work under dated Codex scratch folders. The newer cluster is the intended Werkles working set, but the repo source of truth remains `C:\Users\Ben Leak\github\Werkles`.

After the second pass, active thread searches for `github`, `TinkerDen`, and `packet launcher` returned no visible threads.

Correction after operator clarification:

- Config file: `C:\Users\Ben Leak\.codex\.codex-global-state.json`
- Backup before edit: `C:\Users\Ben Leak\.codex\.codex-global-state.json.backup-before-werkles-project-prune-20260712T1624.json`
- `C:\Users\Ben Leak\Desktop\github` was restored to `electron-saved-workspace-roots` and `project-order`.
- `C:\Users\Ben Leak\Documents\Oddly Godly - The Book` was added to `electron-saved-workspace-roots` and `project-order`.

Residual blocker: the running Codex app process may keep a cached project list until refresh/restart. No live `add_project` / `remove_project` / `remove_workspace_root` tool was exposed in this session.

## Future Rule

For Werkles repo work, start by verifying:

1. `git rev-parse --show-toplevel`
2. `git remote -v`
3. Canonical path is `C:\Users\Ben Leak\github\Werkles`

Do not treat `C:\Users\Ben Leak\Documents\Werkles` or older `C:\Users\Ben Leak\Documents\Codex\2026-*` scratch folders as canonical repo checkouts without a newer explicit receipt.
