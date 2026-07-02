# Dink MaSheen Werkles Local + Cloud Cleanup Packet

Status: ACTIVE
Issued: 2026-07-02
Audience: all Dinks / Aeyes operating Werkles on Sally, Betsy, Doss, Atlas, Wonka Den, and any other MaSheen workstation
Human gate: Ben explicitly ordered the cleanup in Codex on 2026-07-02

## Mission

Collapse every Werkles workstation to one local source sandbox and one GitHub source destination.

Canonical GitHub:

```text
https://github.com/benleakwerkles/Werkles.git
```

Canonical local folder target:

```text
C:\Users\<user>\github\Werkles
```

No Aeye may use a second active Werkles sandbox for normal work.

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

Run this on each machine before declaring it clean:

```powershell
$candidates = @(
  "$env:USERPROFILE\github\Werkles",
  "$env:USERPROFILE\github\Werkles1",
  "$env:USERPROFILE\Desktop\github\Werkles",
  "$env:USERPROFILE\Desktop\github\Werkles1",
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

Then apply these rules:

1. Keep or create the canonical folder at `C:\Users\<user>\github\Werkles`.
2. Set every real Werkles checkout remote to `https://github.com/benleakwerkles/Werkles.git`.
3. If a duplicate folder has no unique commits and no dirty files, rename it to `*-retired-local-YYYYMMDD-HHMMSS`.
4. If a duplicate folder has unique commits, preserve them before archiving:

```powershell
git -C C:\Users\<user>\github\Werkles remote add salvage-local <duplicate-folder-path>
git -C C:\Users\<user>\github\Werkles fetch salvage-local
git -C C:\Users\<user>\github\Werkles branch salvage/local-folder-merge/<machine>/<folder>/<branch>-YYYYMMDD salvage-local/<branch>
git -C C:\Users\<user>\github\Werkles remote remove salvage-local
```

5. If a duplicate folder has dirty or untracked work, create a patch and file inventory before archiving:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$out = "$env:USERPROFILE\github\Werkles-local-merge-receipts\$env:COMPUTERNAME-$stamp"
New-Item -ItemType Directory -Force -Path $out | Out-Null
git -C <duplicate-folder-path> status -sb | Out-File "$out\status.txt"
git -C <duplicate-folder-path> diff | Out-File "$out\worktree.patch"
git -C <duplicate-folder-path> ls-files --others --exclude-standard | Out-File "$out\untracked.txt"
```

6. Do not merge salvage branches into `main` without a new human gate.
7. After cleanup, every machine must produce a readback.

## Helper

After inventory, run the helper in dry-run first:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Migrate-WerklesDestination.ps1
```

If the dry-run shows no `MANUAL_REVIEW`, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Migrate-WerklesDestination.ps1 -Apply
```

If it shows `MANUAL_REVIEW`, stop and preserve the divergent folder using the salvage/patch rules above.

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
DUPLICATE_PATHS_RETIRED:
SALVAGE_BRANCHES_CREATED:
PATCH_RECEIPTS_CREATED:
BLOCKERS:
```

No machine is clean until it reports one active Werkles folder and one canonical GitHub remote.
