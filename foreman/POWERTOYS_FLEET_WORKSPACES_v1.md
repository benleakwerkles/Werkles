# PowerToys Fleet Workspaces v1

Status: ACTIVE
Issued: 2026-07-18
Machine proof host: Betsy (`DESKTOP-KTBH0LA`)
Authority: Operator GO for per-machine PowerToys packs (not one shared layout)

## Doctrine

PowerToys Workspaces is **local only**. One workspace cannot arrange windows on another PC.

Fleet model:

1. **Each machine owns one primary forge workspace** (captured on that machine).
2. **Betsy Hub** also keeps RustDesk so Ben can land on remotes.
3. **After RustDesk lands**, launch that machine’s local pack with one click (Desktop shortcut or `launch-fleet-workspace.ps1`).
4. Registry of names + IDs lives in repo: `foreman/soledash/FLEET_WORKSPACES_REGISTRY.json`.

This is less work than re-arranging windows by hand once each machine has a captured pack + shortcut.

## Machine packs

| Machine | Pack key | Role | Status |
|---------|----------|------|--------|
| **Betsy** | `betsy_hub` | Primary forge + RustDesk hub | **READY** (IDs known) |
| **Betsy** | `betsy_autopaste` | Autopaste / self-heal lane | **READY** |
| **Spanzee** | `spanzee_forge` | Remote forge / former RD server host | **CAPTURE PENDING** |
| **Medullina** | `medullina_aux` | Auxiliary forge | **CAPTURE PENDING** |
| **Sally** | `sally_mirror` | Mirror / snapshot forge | **CAPTURE PENDING** |

## Recipe (what to put in a pack)

Minimum for any forge machine:

- Cursor (repo open)
- File Explorer (canonical repo path)
- Chrome or Edge (crew / dashboards)
- Claude and/or Codex as used on that host
- Perplexity (Thufir) when installed

**Betsy Hub only:** include RustDesk (peers for Spanzee / Medullina / others).

Do **not** try to put Spanzee’s Cursor into Betsy’s workspace JSON — capture Spanzee’s layout **on Spanzee**.

## One-click launch (Betsy)

```powershell
cd "C:\Users\Ben Leak\github\Werkles"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\launch-fleet-workspace.ps1 -Pack betsy_hub
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\install-fleet-workspace-shortcuts.ps1
```

Shortcuts land on the Windows Desktop as `Werkles - <pack label>.lnk`.

## Capture on a remote machine

1. Open RustDesk → machine.
2. Arrange the real desktop the way you want it every day.
3. PowerToys → Workspaces → Capture → name it exactly as the pack `powertoys_name` in the registry.
4. Run `scripts\foreman\capture-local-powertoys-workspaces.ps1` (repo must exist on that machine, or copy the script).
5. Paste the returned JSON block back into `FLEET_WORKSPACES_REGISTRY.json` on Betsy / canon repo.
6. Run `install-fleet-workspace-shortcuts.ps1` on that machine.

Operator packets:

- `foreman/handoffs/outbox/TO_OPERATOR_SPANZEE_POWERTOYS_WORKSPACE_CAPTURE_20260718.md`
- `foreman/handoffs/outbox/TO_OPERATOR_MEDULLINA_POWERTOYS_WORKSPACE_CAPTURE_20260718.md`

## What this is not

- Not FancyZones sync across PCs (separate tool).
- Not Mouse Without Borders (optional pairing).
- Not a substitute for RustDesk — RD is the cross-machine layer; Workspaces is the per-desk layout layer.
