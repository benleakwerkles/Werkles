# TO_OPERATOR_MEDULLINA_POWERTOYS_WORKSPACE_CAPTURE_20260718

Status: ACTION_PACKET
From: Maker@Betsy
To: Ben / Operator at Medullina
Goal: Capture a light local PowerToys workspace pack on Medullina for one-click restore after RustDesk land.

## Why

PowerToys Workspaces are local. Medullina cannot inherit Betsy’s layout. Doctrine: `foreman/POWERTOYS_FLEET_WORKSPACES_v1.md`.

Keep this pack lighter than Betsy Hub — auxiliary forge, not the main cockpit.

## Do This On Medullina

1. Confirm PowerToys is installed and Workspaces is on.
2. Arrange a light daily layout:
   - Cursor (if repo present) or browser
   - File Explorer
   - Chrome
3. PowerToys → **Workspaces** → capture.
4. Name it exactly: `Medullina Aux`
5. Capture IDs:

```powershell
cd <path-to-Werkles-if-present>
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\capture-local-powertoys-workspaces.ps1 -MachineName Medullina
```

Or copy `id` for `Medullina Aux` from:

`%LOCALAPPDATA%\Microsoft\PowerToys\Workspaces\workspaces.json`

## Return This

```text
MEDULLINA_POWERTOYS_CAPTURED: YES / NO
MEDULLINA_WORKSPACE_NAME:
MEDULLINA_WORKSPACE_ID:
MEDULLINA_HOSTNAME:
APPS_INCLUDED:
CONSENT_FOR_AUX_FORGE: YES / NO
BLOCKERS:
```

## After Return

Registry update on Betsy → `medullina_aux` ready. Then on Medullina:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\install-fleet-workspace-shortcuts.ps1 -OnlyMachine Medullina
```

Daily use: RustDesk → Medullina → `Werkles - Medullina Aux`.
