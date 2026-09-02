# TO_OPERATOR_SPANZEE_POWERTOYS_WORKSPACE_CAPTURE_20260718

Status: ACTION_PACKET
From: Maker@Betsy
To: Ben / Operator at Spanzee
Goal: Capture a local PowerToys workspace pack on Spanzee so fleet launch is one click (not hand-arranging every time).

## Why

PowerToys Workspaces cannot be shared from Betsy. Spanzee needs its own pack. Doctrine: `foreman/POWERTOYS_FLEET_WORKSPACES_v1.md`.

## Do This On Spanzee

1. Install / open **Microsoft PowerToys** (Workspaces enabled).
2. Arrange the daily forge layout:
   - Cursor (Werkles repo)
   - File Explorer (repo folder)
   - Chrome (dashboards / crew)
   - Claude and/or Perplexity if used here
3. PowerToys → **Workspaces** → **Create** / capture.
4. Name it exactly: `Spanzee Forge`
5. If the Werkles repo exists on Spanzee, run:

```powershell
cd <path-to-Werkles>
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\capture-local-powertoys-workspaces.ps1 -MachineName Spanzee
```

6. If the repo is not on Spanzee yet, open `%LOCALAPPDATA%\Microsoft\PowerToys\Workspaces\workspaces.json`, find the workspace named `Spanzee Forge`, and copy its `id` value.

## Return This

```text
SPANZEE_POWERTOYS_CAPTURED: YES / NO
SPANZEE_WORKSPACE_NAME:
SPANZEE_WORKSPACE_ID:
SPANZEE_HOSTNAME:
APPS_INCLUDED:
BLOCKERS:
```

## After Return

Maker/Dink on Betsy will:

1. Set `spanzee_forge.workspace_id` + `status: ready` in `foreman/soledash/FLEET_WORKSPACES_REGISTRY.json`
2. You run on Spanzee (once repo is present):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\install-fleet-workspace-shortcuts.ps1 -OnlyMachine Spanzee
```

Daily use: RustDesk → Spanzee → double-click `Werkles - Spanzee Forge`.
