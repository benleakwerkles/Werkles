# Brainstation Workspace Controller Revival Receipt

Status: `PARTIAL_WITH_BLOCKER`

Controller identity: `Heimerdinker@Betsy`

Execution proof: hostname `Betsy`; Windows identity `BETSY\Ben Leak`; repository branch `maker/site-g-20260703`; source commit `cfa334677d0ae82d1bdb55d96e9461462c362ff5`.

Scope: PowerToys Workspace inventory and launch across Betsy, Spanzee, and Medullina. Each machine may launch only a Workspace already present in its own local PowerToys configuration. This work adds no general command runner, packet router, browser control, auto-send, Harvey branch, or fleet job system.

## Implemented

- Betsy controller: `scripts/foreman/Invoke-BrainstationWorkspaces.ps1`
  - Actions: `Status`, `DryRun`, `Launch`, `LaunchAll`
  - Targets are read from `foreman/soledash/BRAINSTATION_WORKSPACES.json`.
  - Every run writes a timestamped JSON receipt plus `BRAINSTATION_WORKSPACE_CONTROL_CURRENT.json`.
- Per-machine listener: `tools/brainstation_workspace_runner.mjs`
  - Routes: `GET /health`, `GET /workspaces`, `POST /workspaces/launch`
  - Workspace launch is limited to an ID or name found in the machine's own PowerToys `workspaces.json`.
  - Inventory and launch routes accept loopback or an explicitly allowlisted Betsy controller IP.
  - A probe for the unrelated `/packets` route returned HTTP `404`.
- Remote-machine installer: `scripts/foreman/Install-BrainstationWorkspaceListener.ps1`
  - Installs the Workspace-only listener as a logon task.
  - Restricts its inbound private-network firewall rule to Betsy's configured IPv4 address.

## Verified

- Node syntax: PASS
- PowerShell syntax for controller, listener installer, and existing self-heal helper: PASS
- Controller configuration JSON: PASS
- Dedicated listener HTTP health, inventory, and dry-run launch: PASS
- General TinkerDen machine runner: unchanged
- Betsy live launch: PASS
  - Receipt: `foreman/receipts/BRAINSTATION_WORKSPACE_CONTROL_20260715T020940Z.json`
  - Workspace: `Betsy Autopaste Workspace`
  - Workspace ID: `{27BB1F1B-BC9E-4DBE-9003-0DAB8576BC0B}`
  - PowerToys monitor indexes: `1`, `2`
  - Result: `WORKSPACE_LAUNCH_COMPLETE`
- Current three-machine status:
  - Receipt: `foreman/receipts/BRAINSTATION_WORKSPACE_CONTROL_20260715T021140Z.json`
  - Betsy: `READY`
  - Spanzee: `NOT_CONNECTED`; hostname does not currently resolve from Betsy
  - Medullina: `NOT_CONNECTED`; hostname does not currently resolve from Betsy

## Blocker

`SPANZEE_AND_MEDULLINA_WORKSPACE_LISTENERS_UNREACHABLE`

Betsy cannot currently resolve or contact Spanzee or Medullina, so the listener cannot be installed remotely and their real local PowerToys Workspace IDs/names cannot be read. Their controller entries deliberately leave Workspace ID and name unset rather than inventing them.

No operator paste, prompt, or other mule action is requested. Once machine access returns, the machine-local Cousin can run the prepared listener installer, after which Heimerdinker can inventory both machines, lock their real Workspace names in the manifest, and execute `LaunchAll` from Betsy.

No commit or push was performed.
