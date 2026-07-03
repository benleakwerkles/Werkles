# Dink MaSheen Werkles Local + Cloud Cleanup Packet

Status: ACTIVE
Issued: 2026-07-02
Audience: all Dinks / Aeyes operating Werkles on Sally, Betsy, Doss, Atlas, Wonka Den, and any other MaSheen workstation
Human gate: Ben explicitly ordered the cleanup in Codex on 2026-07-02

## How To Hand This To Another Dink

Ben may open this same Codex thread on Sally, Betsy, Atlas, Wonka Den, or another MaSheen workstation and say:

```text
Execute the Dink MaSheen Werkles Local + Cloud Cleanup Packet from this thread.
Inventory local Werkles folders first. Do not delete unknown work. Preserve divergent work as salvage evidence. Converge this machine to one active folder and one GitHub remote. Return the required readback block.
```

For Betsy, Spanzee, Medullina, or any machine that has not yet run this cleanup, use the same text and add:

```text
After convergence, install the forward guardrail from the canonical checkout so future pushes and session starts cannot silently use Werkles1, the retired GitHub stub, or a Desktop-path Werkles checkout.
Do the full dirty-root hunt. Do not only check the canonical folder and the obvious Werkles1 folder.
```

If this packet is received in the same Codex thread, treat this thread as the continuity reference. Do not re-open the old `Werkles1` vs `Werkles` debate. The current source-truth decision is already made:

- GitHub canonical repo is `https://github.com/benleakwerkles/Werkles.git`.
- Local canonical folder target is `C:\Users\<user>\github\Werkles`.
- Old `Werkles1` and Desktop-path working trees are migration inputs or archives, not active destinations.

If this packet is received outside this thread, pull the latest canonical repo first and read this file from `foreman/messages/DINK_MASHEEN_WERKLES_LOCAL_CLOUD_CLEANUP_PACKET_20260702.md`.

## Mission

Collapse every Werkles workstation to one local source sandbox and one GitHub source destination.

This is a local double-source-folder merge packet. The GitHub rename alone is not enough. The job is not complete on a machine until all local Werkles folders have been inventoried, every non-canonical folder is either retired or preserved as salvage evidence, and only one active folder remains.

Canonical GitHub:

```text
https://github.com/benleakwerkles/Werkles.git
```

Canonical local folder target:

```text
C:\Users\<user>\github\Werkles
```

No Aeye may use a second active Werkles sandbox for normal work.

## Dirty Root Hunt

Before any folder is renamed, deleted, moved, or declared retired, run the dirty-root hunt. The point is to find the likely places where real work may be hiding.

The inventory helper now checks:

1. The active user profile, `C:\Users\BenLeak`, `C:\Users\benle`, `C:\Users\Ben Leak`, and every visible `C:\Users\*` profile.
2. Under each profile:
   - `github\Werkles`
   - `github\Werkles1`
   - `Desktop\github\Werkles`
   - `Desktop\github\Werkles1`
   - `Desktop\Werkles_DIRTY_BACKUP`
   - `Documents\Werkles`
   - `Documents\GitHub\Werkles`
   - `Source\Werkles`
   - `repos\Werkles`
   - `dev\Werkles`
3. Hard-root suspects:
   - `C:\Dev\Werkles`
   - `C:\Dev\Werkles1`
   - `C:\wt\Werkles`
   - `C:\wt\stbook`
   - `C:\speaker`
   - `C:\tinkarden`
   - `C:\TinkerDen`
4. A shallow recursive scan, default depth 4, under visible profile `github`, `Desktop`, `Desktop\github`, `Documents`, `Documents\GitHub`, `Source`, `repos`, `dev`, `Downloads`, plus `C:\Dev` and `C:\wt`.

Why these paths matter:

| Suspect | Why it is in the hunt |
|---|---|
| `C:\Users\BenLeak\Desktop\github\Werkles` / `C:\Users\benle\Desktop\github\Werkles` | Repeated historical active/dirty Werkles root; Betsy path was previously blocked from Doss-side proof and must be checked on Betsy itself. |
| `C:\Users\benle\Desktop\Werkles_DIRTY_BACKUP` | Known dirty backup snapshot name; archive only unless reviewed file-by-file. |
| `C:\Users\benle\Documents\Werkles` | Known stale partial copy outside the GitHub path. |
| `C:\Dev\Werkles` | Known same-host second surface on Sally-style topology. |
| `C:\speaker` | Adjacent source-truth/relay root that can contain dirty local state; not a Werkles replacement, but must not be deleted or imported wholesale. |
| `C:\tinkarden` / `C:\TinkerDen` | Adjacent command-surface roots linked to dirty TinkerDen transport evidence; inventory only, do not commit wholesale. |
| `C:\wt\stbook` | Known source-truth/book working tree handle; not Werkles canonical, but a local source root that must not be mistaken for disposable clutter. |

The inventory receipt includes `candidate_reasons`, `status_line_count`, `untracked_count`, and bounded samples. If a root has dirty/untracked work, create full patch and untracked receipts before retirement. Do not treat a truncated inventory sample as proof that the full root was preserved.

## Forward Guardrails

This cleanup is not complete on a workstation until the guardrail is installed or a blocker explains why it could not be installed.

From the canonical checkout:

```powershell
cd C:\Users\<user>\github\Werkles
git pull --ff-only origin main
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Assert-WerklesCanonical.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Install-WerklesGitGuard.ps1
```

Equivalent npm commands from the canonical checkout:

```powershell
npm.cmd run guard:werkles
npm.cmd run guard:werkles:install
```

The guardrail checks:

1. The canonical checkout is `C:\Users\<user>\github\Werkles`.
2. The only final remote is `origin = https://github.com/benleakwerkles/Werkles.git`.
3. Forbidden active folders such as `Werkles1`, `Desktop\github\Werkles`, and `C:\Dev\Werkles` are not live git checkouts.
4. Active launchers and prompt pointers do not route humans back to retired Werkles paths.
5. Temporary salvage remotes are removed before work continues.

`Install-WerklesGitGuard.ps1` writes a local `.git\hooks\pre-push` hook. Git hooks are local machine state, not repo state, so every workstation must install it after its cleanup. The hook blocks pushes when a blocker exists, but it does not delete or merge any work.

Guard receipts are written to:

```text
C:\Users\<user>\github\Werkles-local-merge-receipts
```

## Observed Source-Sandbox Addresses

Do not reduce this packet to a generic repo rename. These exact addresses are why the cleanup exists.

| Machine / evidence source | Observed path | Observed state | Packet requirement |
|---|---|---|---|
| Doss live cleanup | `C:\Users\BenLeak\github\Werkles1` | Real active checkout before cleanup; merged and moved locally on Doss. | Must not reappear as active. |
| Doss live cleanup | `C:\Users\BenLeak\github\Werkles` | Current Doss canonical checkout after cleanup. | Keep as Doss active path. |
| Doss live cleanup | `C:\Users\BenLeak\github\Werkles-retired-local-stub-20260702-155538` | Empty local stub quarantine. | Archive only; not source. |
| Doss live cleanup | `C:\Users\BenLeak\Desktop\github\Werkles-retired-local-20260702-155538` | Old Desktop-path quarantine; non-git on Doss at cleanup time. | Archive only; not source. |
| Doss local branch inventory | `backup/pre-werkles-cleanup-main-20260702-152840` | Local-only safety branch at `936e3d6`. | Evidence branch only; do not merge without gate. |
| Doss local branch inventory | `salvage/local-folder-merge/DOSS/old-werkles-inspect/main-20260702-162230` | Local-only salvage branch for old private stub at `726e33c`. | Evidence branch only; do not merge without gate. |
| Sally topology readback | `C:\Users\benle\Desktop\github\Werkles` | Dirty rescue surface, branch `rescue/sally-dirty-worktree-2026-06-01`, commit `8ba905b`, ahead by historical readback. | Inventory and salvage before retiring or moving. |
| Sally topology readback | `C:\Dev\Werkles` | Second same-host surface, branch `snapshot/sally-good-werkles-2026-06-12`, commit `437792b`. | Inventory and classify; do not ignore. |
| BLD/Sally forensic review | `C:\Users\benle\Desktop\github\Werkles1` | App-only mirror / separate repo. | Inventory; retire only after proof of no unique work. |
| BLD/Sally forensic review | `C:\Users\benle\Desktop\Werkles_DIRTY_BACKUP` | Dirty backup snapshot, possible local state/secrets. | Archive only; never commit wholesale. |
| BLD/Sally forensic review | `C:\Users\benle\Documents\Werkles` | Stale partial copy outside GitHub path. | Archive or compare file-by-file; not source. |
| Betsy unverified path evidence | `C:\Users\BenLeak\Desktop\github\Werkles` and `C:\Users\benle\Desktop\github\Werkles` | Prior remote/admin-share checks were blocked; exact live path unknown. | Betsy-local Dink must inventory both user spellings plus canonical path. |

If a Dink finds another Werkles-looking source folder, add it to the readback. Do not assume this table is complete.

## Clean Machine Definition

A machine is clean only when all of these are true:

1. Exactly one active local Werkles source folder exists.
2. That folder is `C:\Users\<user>\github\Werkles`.
3. Its `origin` remote is `https://github.com/benleakwerkles/Werkles.git`.
4. All other discovered Werkles folders are classified as `RETIRED`, `SALVAGE_BRANCH_CREATED`, `PATCH_RECEIPT_CREATED`, or `BLOCKED_FOR_HUMAN_REVIEW`.
5. No Aeye launcher, local script, or active prompt points at `Werkles1` or `Desktop\github\Werkles`.

Do not report `COMPLETE` if two local folders still look like plausible source truth.

## Forbidden Active Destinations

Do not push or route active work to:

```text
https://github.com/benleakwerkles/Werkles1.git
https://github.com/benleakwerkles/Werkles-retired-delete-me-20260702.git
C:\Users\<user>\github\Werkles1
C:\Users\<user>\Desktop\github\Werkles
C:\Users\<user>\Desktop\github\Werkles1
```

Historical folders may remain only after they are renamed with `retired-local-YYYYMMDD-HHMMSS` or are clearly marked archive-only.

## Required Local Merge Protocol

Run this on each machine before declaring it clean. This is the mandatory inventory of possible double-source folders:

Preferred receipt command:

```powershell
cd C:\Users\<user>\github\Werkles
git pull --ff-only origin main
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Inventory-WerklesLocalSources.ps1 -ScanDepth 4
```

If the canonical checkout does not exist yet, run the manual inventory below before cloning or moving anything.

```powershell
$candidates = @(
  "$env:USERPROFILE\github\Werkles",
  "$env:USERPROFILE\github\Werkles1",
  "$env:USERPROFILE\Desktop\github\Werkles",
  "$env:USERPROFILE\Desktop\github\Werkles1",
  "$env:USERPROFILE\Desktop\Werkles_DIRTY_BACKUP",
  "$env:USERPROFILE\Documents\Werkles",
  "C:\Dev\Werkles",
  "C:\Dev\Werkles1"
)

foreach ($path in $candidates) {
  if (Test-Path -LiteralPath $path) {
    Write-Host "=== $path"
    if (Test-Path -LiteralPath (Join-Path $path ".git")) {
      git -C $path remote -v
      git -C $path status -sb
      git -C $path branch --show-current
      git -C $path rev-parse --short HEAD
    } else {
      Write-Host "NOT_GIT_REPO"
    }
  }
}
```

For every real git checkout found, classify it:

```powershell
git -C <folder> remote -v
git -C <folder> status --porcelain=v1
git -C <folder> branch --show-current
git -C <folder> rev-parse --short HEAD
git -C <folder> rev-list --left-right --count origin/main...HEAD
git -C <folder> log --oneline origin/main..HEAD
git -C <folder> ls-files --others --exclude-standard
```

Also inventory local-only branches in the chosen canonical checkout:

```powershell
git -C C:\Users\<user>\github\Werkles branch -vv
git -C C:\Users\<user>\github\Werkles for-each-ref --format="%(refname:short)|%(objectname:short)|%(upstream:short)|%(subject)" refs/heads
```

Local-only `backup/...`, `salvage/...`, `rescue/...`, and `snapshot/...` branches are evidence, not active source truth, unless Ben explicitly promotes them.

Use these classifications:

| Classification | Meaning | Required action |
|---|---|---|
| `KEEP_CANONICAL` | The folder is `C:\Users\<user>\github\Werkles`, points at canonical GitHub, and has the chosen working state. | Keep it active. |
| `MOVE_TO_CANONICAL` | There is only one real Werkles checkout and it is named/path-located wrong. | Move/rename it to `C:\Users\<user>\github\Werkles`. |
| `RETIRE_DUPLICATE` | Duplicate checkout has no dirty files, no untracked files, and no unique commits versus canonical. | Rename to `*-retired-local-YYYYMMDD-HHMMSS`. |
| `SALVAGE_REQUIRED` | Duplicate checkout has commits not present in canonical. | Fetch it into canonical and create a `salvage/local-folder-merge/...` branch before retiring. |
| `PATCH_REQUIRED` | Duplicate checkout has dirty or untracked work. | Write patch/untracked receipts before retiring. |
| `BLOCKED_FOR_HUMAN_REVIEW` | Two folders both contain plausible source truth and the safe winner is not obvious. | Stop and return readback. Do not archive either folder. |

Then apply these rules in order:

1. Keep or create the canonical folder at `C:\Users\<user>\github\Werkles`.
2. Set every real Werkles checkout remote to `https://github.com/benleakwerkles/Werkles.git`.
3. If there is only one real checkout but it is in `Werkles1`, `Desktop\github\Werkles`, or `C:\Dev\Werkles`, move that checkout to the canonical path.
4. If two or more real checkouts exist, pick `C:\Users\<user>\github\Werkles` as the active destination unless its contents are an empty stub.
5. If a duplicate folder has no unique commits and no dirty files, rename it to `*-retired-local-YYYYMMDD-HHMMSS`.
6. If a duplicate folder has unique commits, preserve them before archiving:

```powershell
git -C C:\Users\<user>\github\Werkles remote add salvage-local <duplicate-folder-path>
git -C C:\Users\<user>\github\Werkles fetch salvage-local
git -C C:\Users\<user>\github\Werkles branch salvage/local-folder-merge/<machine>/<folder>/<branch>-YYYYMMDD salvage-local/<branch>
git -C C:\Users\<user>\github\Werkles remote remove salvage-local
```

7. If a duplicate folder has dirty or untracked work, create a patch and file inventory before archiving:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$out = "$env:USERPROFILE\github\Werkles-local-merge-receipts\$env:COMPUTERNAME-$stamp"
New-Item -ItemType Directory -Force -Path $out | Out-Null
git -C <duplicate-folder-path> status -sb | Out-File "$out\status.txt"
git -C <duplicate-folder-path> diff | Out-File "$out\worktree.patch"
git -C <duplicate-folder-path> ls-files --others --exclude-standard | Out-File "$out\untracked.txt"
```

8. Do not merge salvage branches into `main` without a new human gate.
9. After cleanup, every machine must produce a readback.

## Helper

After inventory, run the helper from the canonical checkout in dry-run first. Do not run `-Apply` until the inventory receipt is created and reviewed.

```powershell
cd C:\Users\<user>\github\Werkles
git pull --ff-only origin main
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Inventory-WerklesLocalSources.ps1 -ScanDepth 4
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Migrate-WerklesDestination.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Assert-WerklesCanonical.ps1
```

If the dry-run shows no `MANUAL_REVIEW`, run:

```powershell
cd C:\Users\<user>\github\Werkles
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Migrate-WerklesDestination.ps1 -Apply
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Assert-WerklesCanonical.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Install-WerklesGitGuard.ps1
```

If it shows `MANUAL_REVIEW`, stop and preserve the divergent folder using the salvage/patch rules above.

The helper is allowed to rename empty stubs and obviously wrong-path folders. It is not allowed to decide that a real divergent checkout is disposable.

## Cloud Cleanup State

- The old private stub previously occupying `benleakwerkles/Werkles` could not be hard-deleted because GitHub returned `403 Forbidden`.
- That stub was renamed and archived as `benleakwerkles/Werkles-retired-delete-me-20260702`.
- The former canonical `benleakwerkles/Werkles1` was renamed to `benleakwerkles/Werkles`.
- `origin/main` is the only canonical source truth.

## Required Readback

Return this block after each machine cleanup:

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

No machine is clean until it reports one active Werkles folder and one canonical GitHub remote.
