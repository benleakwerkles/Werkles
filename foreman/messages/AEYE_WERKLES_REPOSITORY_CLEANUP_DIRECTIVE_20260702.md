# Aeye Werkles Repository Cleanup Directive

Status: ACTIVE
Issued: 2026-07-02
Authority: Ben direct approval in Codex thread, recorded in `foreman/gates/APPROVAL_LOG.md`

## Order

Effective immediately, the only canonical GitHub repository for Werkles code is:

```text
https://github.com/benleakwerkles/Werkles.git
```

Do not push Werkles code to:

```text
https://github.com/benleakwerkles/Werkles1.git
https://github.com/benleakwerkles/Werkles-retired-delete-me-20260702.git
```

## GitHub Cleanup State

- The former canonical repository `benleakwerkles/Werkles1` was renamed to `benleakwerkles/Werkles`.
- The old private stub repository `benleakwerkles/Werkles` could not be hard-deleted by the available credential because GitHub returned `403 Forbidden`.
- To remove the trap name, that old stub was renamed and archived as `benleakwerkles/Werkles-retired-delete-me-20260702`.
- The retired stub is not source truth and must not receive pushes.

## Local Workstation Rule

Preferred local code path on every Aeye workstation:

```text
C:\Users\<user>\github\Werkles
```

Do not create or keep active Werkles working trees at:

```text
C:\Users\<user>\github\Werkles1
C:\Users\<user>\Desktop\github\Werkles
C:\Users\<user>\Desktop\github\Werkles1
```

Those paths may exist only as clearly named historical archives after migration.

## Required Machine Action

On each workstation, verify and remediate:

```powershell
git remote -v
git branch --show-current
git rev-parse --short HEAD
```

If the origin remote points to `Werkles1.git` or the retired stub, change it:

```powershell
git remote set-url origin https://github.com/benleakwerkles/Werkles.git
```

If a local folder is named `Werkles1`, migrate it to `Werkles` after confirming there is no real active `Werkles` checkout in the destination slot. Do not delete unknown work; quarantine confusing local folders with a `retired-local-YYYYMMDD` suffix.

Preferred migration helper:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Migrate-WerklesDestination.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Migrate-WerklesDestination.ps1 -Apply
```

## Proof Boundary

This directive changes GitHub destination truth and the Doss local cleanup lane. It does not prove that every offline workstation has already renamed its local folder. Each machine must produce a local readback after it runs the migration.
